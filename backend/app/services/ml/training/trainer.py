# app/services/ml/training/trainer.py
from typing import Optional, Tuple, Any
from sqlalchemy.orm import Session
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import os
import torch
import tensorflow as tf
import joblib
from app.models.training import Training
from app.models.model import MLModel
from app.models.dataset import Dataset
from app.services.ml.training import PyTorchTrainer, TensorFlowTrainer, SklearnTrainer
from app.core.config import settings

logger = logging.getLogger(__name__)

async def save_trained_model(model: Any, framework: str, model_id: int) -> str:
    """Save trained model and return file path"""
    try:
        # Create model directory if it doesn't exist
        model_dir = settings.get_model_path(model_id)
        os.makedirs(model_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if framework == "pytorch":
            file_path = os.path.join(model_dir, f"model_{timestamp}.pt")
            torch.save({
                'model': model,
                'state_dict': model.state_dict(),
                'timestamp': timestamp
            }, file_path)
            
        elif framework == "tensorflow":
            file_path = os.path.join(model_dir, f"model_{timestamp}")
            model.save(file_path)
            
        elif framework == "sklearn":
            file_path = os.path.join(model_dir, f"model_{timestamp}.joblib")
            joblib.dump(model, file_path)
            
        else:
            raise ValueError(f"Unsupported framework: {framework}")
            
        logger.info(f"Model saved successfully to {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        raise

def get_trainer(framework: str, model_config: dict, training_config: dict):
    """Initialize appropriate trainer based on framework"""
    if framework == "pytorch":
        return PyTorchTrainer(model_config=model_config, training_config=training_config)
    elif framework == "tensorflow":
        return TensorFlowTrainer(model_config=model_config, training_config=training_config)
    elif framework == "sklearn":
        return SklearnTrainer(model_config=model_config, training_config=training_config)
    else:
        raise ValueError(f"Unsupported framework: {framework}")

def load_dataset(dataset: Dataset) -> Tuple[np.ndarray, np.ndarray]:
    """
    Load and preprocess dataset from file
    """
    try:
        logger.info(f"Loading dataset from {dataset.file_path}")
        
        # Read dataset based on format
        if dataset.format.lower() == 'csv':
            df = pd.read_csv(dataset.file_path)
        elif dataset.format.lower() == 'parquet':
            df = pd.read_parquet(dataset.file_path)
        else:
            raise ValueError(f"Unsupported file format: {dataset.format}")

        # Basic preprocessing
        # Remove any missing values
        df = df.dropna()
        
        # Convert categorical variables if any
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            df[col] = pd.Categorical(df[col]).codes

        # Assuming the last column is the target variable
        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values

        # Update dataset metadata
        dataset.num_rows = len(df)
        dataset.num_features = len(df.columns) - 1
        dataset.meta_info = {
            "columns": list(df.columns),
            "feature_names": list(df.columns[:-1]),
            "target_name": df.columns[-1],
            "categorical_columns": list(categorical_columns),
            "numeric_columns": list(df.select_dtypes(include=['int64', 'float64']).columns)
        }

        logger.info(f"Successfully loaded dataset: {len(X)} samples, {X.shape[1]} features")
        return X, y

    except Exception as e:
        logger.error(f"Error loading dataset: {str(e)}")
        raise

async def start_training_job(training_id: int, db: Session) -> None:
    """
    Start a training job in the background.
    """
    training = None
    try:
        # Get training record
        training = db.query(Training).filter(Training.id == training_id).first()
        if not training:
            logger.error(f"Training job {training_id} not found")
            return

        # Update status to running
        training.status = "running"
        training.start_time = datetime.utcnow()
        db.commit()

        # Get associated model and dataset
        model = db.query(MLModel).filter(MLModel.id == training.model_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == training.dataset_id).first()

        if not model or not dataset:
            raise ValueError("Model or dataset not found")

        # Initialize trainer
        trainer = get_trainer(
            framework=model.framework,
            model_config=model.config,
            training_config=training.hyperparameters or {}
        )

        # Load and prepare data
        logger.info("Loading dataset...")
        X, y = load_dataset(dataset)
        
        # Split data if validation split is specified
        if training.hyperparameters.get('validation_split'):
            from sklearn.model_selection import train_test_split
            val_split = float(training.hyperparameters['validation_split'])
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, 
                test_size=val_split, 
                random_state=42
            )
            train_data = (X_train, y_train)
            val_data = (X_val, y_val)
        else:
            train_data = (X, y)
            val_data = None

        # Prepare data in framework-specific format
        prepared_data = trainer.prepare_data(train_data, val_data)

        # Start training
        logger.info("Starting model training...")
        trained_model, history = await trainer.train(prepared_data)

        # Save trained model
        logger.info("Saving trained model...")
        file_path = await save_trained_model(
            model=trained_model,
            framework=model.framework,
            model_id=model.id
        )
        
        # Update model with file path
        model.file_path = file_path
        db.add(model)

        # Update training record with results
        training.status = "completed"
        training.end_time = datetime.utcnow()
        training.duration = (training.end_time - training.start_time).total_seconds()
        training.metrics = {"history": history}
        training.epochs_completed = len(history.get("train_loss", []))
        db.commit()

        logger.info(f"Training completed successfully for job {training_id}")

    except Exception as e:
        logger.error(f"Error in training job {training_id}: {str(e)}")
        if training:
            training.status = "failed"
            training.error_message = str(e)
            training.end_time = datetime.utcnow()
            if training.start_time:
                training.duration = (training.end_time - training.start_time).total_seconds()
            db.commit()
        raise

# Optional: Add model version management
async def cleanup_old_model_versions(model_id: int):
    """Clean up old model versions keeping only the most recent ones"""
    try:
        model_dir = settings.get_model_path(model_id)
        if not os.path.exists(model_dir):
            return
            
        # List all model files
        files = sorted(
            [f for f in os.listdir(model_dir) if f.startswith("model_")],
            reverse=True
        )
        
        # Keep only the most recent versions
        files_to_delete = files[settings.MODEL_VERSIONS_TO_KEEP:]
        
        for file in files_to_delete:
            file_path = os.path.join(model_dir, file)
            try:
                os.remove(file_path)
                logger.info(f"Deleted old model version: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete old model version {file_path}: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error cleaning up old model versions: {str(e)}")