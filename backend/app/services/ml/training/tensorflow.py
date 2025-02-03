# tensorflow.py
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers
import numpy as np
from typing import Dict, Any, Optional, List, Union
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class TensorFlowTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.model = None

    def _initialize_model(self, input_dim: int, output_dim: int) -> tf.keras.Model:
        """
        Initialize TensorFlow model based on configuration
        """
        architecture = self.model_config.get("architecture", "mlp")
        
        if architecture == "mlp":
            hidden_layers = self.model_config.get("hidden_layers", [64, 32])
            
            model = models.Sequential()
            model.add(layers.Input(shape=(input_dim,)))
            
            for hidden_dim in hidden_layers:
                model.add(layers.Dense(hidden_dim, activation='relu'))
                model.add(layers.Dropout(self.model_config.get("dropout_rate", 0.2)))
            
            model.add(layers.Dense(output_dim))
            
            return model
        else:
            raise ValueError(f"Unsupported architecture: {architecture}")

    def prepare_data(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Tuple[tf.data.Dataset, Optional[tf.data.Dataset]]:
        """
        Prepare TensorFlow datasets
        """
        batch_size = self.training_config.get("batch_size", 32)
        
        train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train))
        train_dataset = train_dataset.shuffle(buffer_size=1000).batch(batch_size)

        val_dataset = None
        if X_val is not None and y_val is not None:
            val_dataset = tf.data.Dataset.from_tensor_slices((X_val, y_val))
            val_dataset = val_dataset.batch(batch_size)

        return train_dataset, val_dataset

    async def train(
        self,
        train_dataset: tf.data.Dataset,
        val_dataset: Optional[tf.data.Dataset] = None,
        callbacks: Optional[List[tf.keras.callbacks.Callback]] = None
    ) -> tf.keras.callbacks.History:
        """
        Train the TensorFlow model
        """
        try:
            # Initialize model
            input_dim = next(iter(train_dataset))[0].shape[1]
            output_dim = 1  # Adjust based on your task
            self.model = self._initialize_model(input_dim, output_dim)

            # Compile model
            self.model.compile(
                optimizer=optimizers.Adam(
                    learning_rate=self.training_config.get("learning_rate", 0.001)
                ),
                loss='mse',
                metrics=['mae']
            )

            # Train model
            history = self.model.fit(
                train_dataset,
                epochs=self.training_config.get("epochs", 10),
                validation_data=val_dataset,
                callbacks=callbacks
            )

            return history

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def evaluate(
        self,
        val_dataset: tf.data.Dataset
    ) -> Dict[str, float]:
        """
        Evaluate the model on validation data
        """
        if self.model is None:
            raise ValueError("Model not trained yet")

        results = self.model.evaluate(val_dataset, return_dict=True)
        return results

    def save_model(self, path: Union[str, Path]) -> None:
        """
        Save the trained model
        """
        if self.model is None:
            raise ValueError("No model to save")

        self.model.save(path)
        
        # Save configurations
        config_path = Path(path).parent / f"{Path(path).stem}_config.json"
        with open(config_path, 'w') as f:
            json.dump({
                'model_config': self.model_config,
                'training_config': self.training_config
            }, f)

    def load_model(self, path: Union[str, Path]) -> None:
        """
        Load a trained model
        """
        self.model = models.load_model(path)
        
        # Load configurations
        config_path = Path(path).parent / f"{Path(path).stem}_config.json"
        with open(config_path, 'r') as f:
            configs = json.load(f)
            self.model_config = configs['model_config']
            self.training_config = configs['training_config']