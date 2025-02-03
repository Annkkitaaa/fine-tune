# pytorch.py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class CustomDataset(Dataset):
    def __init__(self, features: np.ndarray, targets: np.ndarray):
        self.features = torch.FloatTensor(features)
        self.targets = torch.FloatTensor(targets)

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.targets[idx]

class PyTorchTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.optimizer = None
        self.criterion = None

    def _initialize_model(self, input_dim: int, output_dim: int) -> nn.Module:
        """
        Initialize PyTorch model based on configuration
        """
        architecture = self.model_config.get("architecture", "mlp")
        
        if architecture == "mlp":
            hidden_layers = self.model_config.get("hidden_layers", [64, 32])
            
            layers = []
            prev_dim = input_dim
            
            for hidden_dim in hidden_layers:
                layers.extend([
                    nn.Linear(prev_dim, hidden_dim),
                    nn.ReLU(),
                    nn.Dropout(self.model_config.get("dropout_rate", 0.2))
                ])
                prev_dim = hidden_dim
            
            layers.append(nn.Linear(prev_dim, output_dim))
            
            return nn.Sequential(*layers)
        else:
            raise ValueError(f"Unsupported architecture: {architecture}")

    def prepare_training(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Tuple[DataLoader, Optional[DataLoader]]:
        """
        Prepare training and validation data loaders
        """
        train_dataset = CustomDataset(X_train, y_train)
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.training_config.get("batch_size", 32),
            shuffle=True
        )

        val_loader = None
        if X_val is not None and y_val is not None:
            val_dataset = CustomDataset(X_val, y_val)
            val_loader = DataLoader(
                val_dataset,
                batch_size=self.training_config.get("batch_size", 32),
                shuffle=False
            )

        return train_loader, val_loader

    async def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        callbacks: Optional[List[Any]] = None
    ) -> Dict[str, List[float]]:
        """
        Train the PyTorch model
        """
        input_dim = next(iter(train_loader))[0].shape[1]
        output_dim = 1  # Adjust based on your task
        
        self.model = self._initialize_model(input_dim, output_dim).to(self.device)
        self.optimizer = optim.Adam(
            self.model.parameters(),
            lr=self.training_config.get("learning_rate", 0.001)
        )
        self.criterion = nn.MSELoss()

        epochs = self.training_config.get("epochs", 10)
        history = {
            "train_loss": [],
            "val_loss": [] if val_loader else None
        }

        try:
            for epoch in range(epochs):
                # Training
                self.model.train()
                train_loss = 0.0
                for batch_features, batch_targets in train_loader:
                    batch_features = batch_features.to(self.device)
                    batch_targets = batch_targets.to(self.device)

                    self.optimizer.zero_grad()
                    outputs = self.model(batch_features)
                    loss = self.criterion(outputs, batch_targets)
                    loss.backward()
                    self.optimizer.step()

                    train_loss += loss.item()

                avg_train_loss = train_loss / len(train_loader)
                history["train_loss"].append(avg_train_loss)

                # Validation
                if val_loader:
                    val_loss = self.evaluate(val_loader)
                    history["val_loss"].append(val_loss)

                # Logging
                logger.info(
                    f"Epoch {epoch+1}/{epochs} - "
                    f"train_loss: {avg_train_loss:.4f}"
                    + (f" - val_loss: {val_loss:.4f}" if val_loader else "")
                )

                # Execute callbacks
                if callbacks:
                    for callback in callbacks:
                        callback(epoch, history)

            return history

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def evaluate(self, val_loader: DataLoader) -> float:
        """
        Evaluate the model on validation data
        """
        self.model.eval()
        val_loss = 0.0

        with torch.no_grad():
            for batch_features, batch_targets in val_loader:
                batch_features = batch_features.to(self.device)
                batch_targets = batch_targets.to(self.device)

                outputs = self.model(batch_features)
                loss = self.criterion(outputs, batch_targets)
                val_loss += loss.item()

        return val_loss / len(val_loader)

    def save_model(self, path: Union[str, Path]) -> None:
        """
        Save the trained model
        """
        if self.model is None:
            raise ValueError("No model to save")

        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'model_config': self.model_config,
            'training_config': self.training_config
        }, path)

    def load_model(self, path: Union[str, Path]) -> None:
        """
        Load a trained model
        """
        checkpoint = torch.load(path)
        self.model_config = checkpoint['model_config']
        self.training_config = checkpoint['training_config']
        
        input_dim = self.model_config['input_dim']
        output_dim = self.model_config['output_dim']
        
        self.model = self._initialize_model(input_dim, output_dim)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        
        self.optimizer = optim.Adam(self.model.parameters())
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])