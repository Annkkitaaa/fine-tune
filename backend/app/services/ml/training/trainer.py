from typing import Optional, Tuple, Any
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timezone
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
            file_path = os.path.join(model_dir, f"model_{timestamp}.keras")  # Use .keras extension
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
        
        if dataset.format.lower() == 'csv':
            df = pd.read_csv(dataset.file_path)
        elif dataset.format.lower() == 'parquet':
            df = pd.read_parquet(dataset.file_path)
        else:
            raise ValueError(f"Unsupported file format: {dataset.format}")

        df = df.dropna()
        
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            df[col] = pd.Categorical(df[col]).codes

        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values

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
        training = db.query(Training).filter(Training.id == training_id).first()
        if not training:
            logger.error(f"Training job {training_id} not found")
            return

        training.status = "running"
        training.start_time = datetime.now(timezone.utc)
        training.epochs_completed = 0
        if training.hyperparameters and 'epochs' in training.hyperparameters:
            training.epochs_total = training.hyperparameters['epochs']
        
        # Initialize metrics
        if not training.metrics:
            training.metrics = {}
        
        db.commit()

        model = db.query(MLModel).filter(MLModel.id == training.model_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == training.dataset_id).first()

        if not model or not dataset:
            raise ValueError("Model or dataset not found")

        trainer = get_trainer(
            framework=model.framework,
            model_config=model.config,
            training_config=training.hyperparameters or {}
        )

        logger.info("Loading dataset...")
        X, y = load_dataset(dataset)
        
        if training.hyperparameters.get('validation_split'):
            from sklearn.model_selection import train_test_split
            val_split = float(training.hyperparameters['validation_split'])
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, 
                test_size=val_split, 
                random_state=42
            )
        else:
            X_train, y_train = X, y
            X_val, y_val = None, None

        # Prepare callbacks based on framework
        callbacks = []
        
        if model.framework == "tensorflow":
            # For TensorFlow, we need a Keras Callback subclass
            class TFMetricsCallback(tf.keras.callbacks.Callback):
                def __init__(self, training_id, db_session):
                    super().__init__()
                    self.training_id = training_id
                    self.db = db_session
                    self.epoch = 0
                
                def on_epoch_end(self, epoch, logs=None):
                    logs = logs or {}
                    self.epoch = epoch
                    
                    training_record = self.db.query(Training).filter(Training.id == self.training_id).first()
                    if not training_record:
                        logger.error(f"Training {self.training_id} not found during callback")
                        return
                    
                    # Update epochs completed
                    training_record.epochs_completed = epoch + 1
                    
                    # Update metrics
                    current_metrics = training_record.metrics or {}
                    
                    # Store loss values
                    if 'loss' in logs:
                        current_metrics['loss'] = float(logs['loss'])
                    
                    if 'val_loss' in logs:
                        current_metrics['val_loss'] = float(logs['val_loss'])
                    
                    # Store accuracy if available
                    if 'accuracy' in logs:
                        current_metrics['accuracy'] = float(logs['accuracy'])
                    
                    if 'val_accuracy' in logs:
                        current_metrics['val_accuracy'] = float(logs['val_accuracy'])
                    
                    # Add history data
                    if 'history' not in current_metrics:
                        current_metrics['history'] = {
                            'train_loss': [],
                            'val_loss': [],
                            'train_accuracy': [],
                            'val_accuracy': []
                        }
                    
                    # Update history lists
                    if 'loss' in logs:
                        current_metrics['history']['train_loss'].append(float(logs['loss']))
                    if 'val_loss' in logs:
                        current_metrics['history']['val_loss'].append(float(logs['val_loss']))
                    if 'accuracy' in logs:
                        current_metrics['history']['train_accuracy'].append(float(logs['accuracy']))
                    if 'val_accuracy' in logs:
                        current_metrics['history']['val_accuracy'].append(float(logs['val_accuracy']))
                    
                    # Add system resource metrics
                    try:
                        import psutil
                        current_metrics['cpu_usage'] = psutil.cpu_percent() / 100.0
                        current_metrics['memory_usage'] = psutil.virtual_memory().percent / 100.0
                        
                        # Try to get GPU usage if available
                        try:
                            import GPUtil
                            gpus = GPUtil.getGPUs()
                            if gpus:
                                current_metrics['gpu_usage'] = gpus[0].load
                        except (ImportError, Exception) as e:
                            logger.debug(f"GPU metrics not available: {str(e)}")
                            current_metrics['gpu_usage'] = 0.0
                    except ImportError:
                        logger.debug("psutil not available for system metrics")
                    
                    # Update the metrics in the database
                    training_record.metrics = current_metrics
                    self.db.commit()
                    logger.debug(f"Updated metrics for training {self.training_id}, epoch {epoch+1}")
            
            # Create TensorFlow callback
            metrics_callback = TFMetricsCallback(training_id, db)
            callbacks.append(metrics_callback)
            
        else:
            # For PyTorch and scikit-learn models
            class GenericMetricsCallback:
                def __init__(self, training_id, db_session):
                    self.training_id = training_id
                    self.db = db_session
                    self.epoch = 0
                
                def __call__(self, epoch, metrics):
                    self.epoch = epoch
                    training_record = self.db.query(Training).filter(Training.id == self.training_id).first()
                    if not training_record:
                        logger.error(f"Training {self.training_id} not found during callback")
                        return
                    
                    # Update epochs completed
                    training_record.epochs_completed = epoch + 1
                    
                    # Update metrics
                    current_metrics = training_record.metrics or {}
                    
                    # Store loss values
                    if 'train_loss' in metrics:
                        current_metrics['loss'] = float(metrics['train_loss'][-1] if isinstance(metrics['train_loss'], list) else metrics['train_loss'])
                    
                    if 'val_loss' in metrics:
                        current_metrics['val_loss'] = float(metrics['val_loss'][-1] if isinstance(metrics['val_loss'], list) else metrics['val_loss'])
                    
                    # Store accuracy if available
                    if 'train_accuracy' in metrics:
                        current_metrics['accuracy'] = float(metrics['train_accuracy'][-1] if isinstance(metrics['train_accuracy'], list) else metrics['train_accuracy'])
                    
                    if 'val_accuracy' in metrics:
                        current_metrics['val_accuracy'] = float(metrics['val_accuracy'][-1] if isinstance(metrics['val_accuracy'], list) else metrics['val_accuracy'])
                    
                    # Add history data
                    if 'history' not in current_metrics:
                        current_metrics['history'] = {
                            'train_loss': [],
                            'val_loss': [],
                            'train_accuracy': [],
                            'val_accuracy': []
                        }
                    
                    # Update history lists
                    for metric_name in ['train_loss', 'val_loss', 'train_accuracy', 'val_accuracy']:
                        if metric_name in metrics:
                            value = metrics[metric_name]
                            if isinstance(value, list):
                                current_metrics['history'][metric_name] = value
                            else:
                                current_metrics['history'][metric_name].append(float(value))
                    
                    # Add system resource metrics
                    try:
                        import psutil
                        current_metrics['cpu_usage'] = psutil.cpu_percent() / 100.0
                        current_metrics['memory_usage'] = psutil.virtual_memory().percent / 100.0
                        
                        # Try to get GPU usage if available
                        try:
                            import GPUtil
                            gpus = GPUtil.getGPUs()
                            if gpus:
                                current_metrics['gpu_usage'] = gpus[0].load
                        except (ImportError, Exception) as e:
                            logger.debug(f"GPU metrics not available: {str(e)}")
                            current_metrics['gpu_usage'] = 0.0
                    except ImportError:
                        logger.debug("psutil not available for system metrics")
                    
                    # Update the metrics in the database
                    training_record.metrics = current_metrics
                    self.db.commit()
                    logger.debug(f"Updated metrics for training {self.training_id}, epoch {epoch+1}")
            
            # Create non-TensorFlow callback
            metrics_callback = GenericMetricsCallback(training_id, db)
            callbacks.append(metrics_callback)

        # Prepare data loaders based on framework
        logger.info(f"Preparing data for {model.framework} model...")
        if model.framework == "pytorch":
            train_loader, val_loader = trainer.prepare_training(X_train, y_train, X_val, y_val)
        elif model.framework == "tensorflow":
            train_loader, val_loader = trainer.prepare_data(X_train, y_train, X_val, y_val)
        elif model.framework == "sklearn":
            train_loader, val_loader = (X_train, y_train), (X_val, y_val) if X_val is not None and y_val is not None else (None, None)
        else:
            raise ValueError(f"Unsupported framework: {model.framework}")
            
        logger.info("Starting model training...")
        trained_model, history = await trainer.train(train_loader, val_loader, callbacks=callbacks)

        logger.info("Saving trained model...")
        file_path = await save_trained_model(
            model=trained_model,
            framework=model.framework,
            model_id=model.id
        )
        
        model.file_path = file_path
        db.add(model)

        # Final update to training record
        training = db.query(Training).filter(Training.id == training_id).first()
        training.status = "completed"
        training.end_time = datetime.now(timezone.utc)
        training.duration = (training.end_time - training.start_time).total_seconds()
        
        # Ensure metrics history is complete
        if not training.metrics:
            training.metrics = {}
        
        # Update final history if callback didn't capture everything
        if metrics_callback.epoch + 1 < len(history.get("train_loss", [])):
            training.metrics["history"] = history
        
        training.epochs_completed = len(history.get("train_loss", []))
        
        # Add final performance metrics if available
        if X_val is not None and y_val is not None:
            try:
                # For scikit-learn models
                if hasattr(trained_model, 'score'):
                    accuracy = trained_model.score(X_val, y_val)
                    training.metrics['accuracy'] = float(accuracy)
                
                # For TensorFlow models
                elif hasattr(trained_model, 'evaluate'):
                    eval_results = trained_model.evaluate(val_loader, verbose=0)
                    if isinstance(eval_results, list) and len(eval_results) > 1:
                        training.metrics['val_loss'] = float(eval_results[0])
                        training.metrics['val_accuracy'] = float(eval_results[1])
                    elif isinstance(eval_results, float):
                        training.metrics['val_loss'] = float(eval_results)
            except Exception as eval_error:
                logger.warning(f"Error evaluating model after training: {str(eval_error)}")
        
        db.commit()
        logger.info(f"Training completed successfully for job {training_id}")

    except Exception as e:
        logger.error(f"Error in training job {training_id}: {str(e)}")
        if training:
            training.status = "failed"
            training.error_message = str(e)
            training.end_time = datetime.now(timezone.utc)
            if training.start_time:
                training.duration = (training.end_time - training.start_time).total_seconds()
            db.commit()
        raise

async def cleanup_old_model_versions(model_id: int):
    """Clean up old model versions keeping only the most recent ones"""
    try:
        model_dir = settings.get_model_path(model_id)
        if not os.path.exists(model_dir):
            return
            
        files = sorted(
            [f for f in os.listdir(model_dir) if f.startswith("model_")],
            reverse=True
        )
        
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
