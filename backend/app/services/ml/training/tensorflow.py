# tensorflow.py
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers
import numpy as np
from typing import Dict, Any, Optional, List, Union, Tuple
import logging
from pathlib import Path
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure TensorFlow for reduced memory usage
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        # Set memory growth for GPUs
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        logger.warning(f"GPU configuration error: {e}")

# Configure CPU threads
tf.config.threading.set_inter_op_parallelism_threads(settings.TF_NUM_INTEROP_THREADS)
tf.config.threading.set_intra_op_parallelism_threads(settings.TF_NUM_INTRAOP_THREADS)

class TensorFlowTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.model = None
        
        # Set memory-efficient default configurations
        self.training_config.setdefault("batch_size", settings.DEFAULT_BATCH_SIZE)
        self.training_config.setdefault("epochs", min(10, settings.MAX_EPOCHS))

    def _initialize_model(self, input_dim: int, output_dim: int) -> tf.keras.Model:
        """Initialize TensorFlow model based on configuration"""
        architecture = self.model_config.get("architecture", "mlp")
        
        if architecture == "mlp":
            # Use smaller default layer sizes
            hidden_layers = self.model_config.get("hidden_layers", [32, 16])
            
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
        """Prepare TensorFlow datasets"""
        batch_size = self.training_config.get("batch_size", settings.DEFAULT_BATCH_SIZE)
        
        # Use smaller buffer size for shuffling to reduce memory usage
        train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train))
        train_dataset = train_dataset.shuffle(buffer_size=min(500, len(X_train))).batch(batch_size)

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
        """Train the TensorFlow model"""
        try:
            input_dim = next(iter(train_dataset))[0].shape[1]
            output_dim = 1  # Adjust based on your task
            
            # Initialize model if not already initialized
            if self.model is None:
                self.model = self._initialize_model(input_dim, output_dim)

            # Use a more memory-efficient optimizer
            self.model.compile(
                optimizer=optimizers.Adam(
                    learning_rate=self.training_config.get("learning_rate", 0.001)
                ),
                loss='mse',
                metrics=['mae'],
                run_eagerly=False  # Disable eager execution for better memory efficiency
            )

            # Add memory-efficient callbacks
            if callbacks is None:
                callbacks = []
            
            callbacks.append(tf.keras.callbacks.EarlyStopping(
                monitor='val_loss' if val_dataset else 'loss',
                patience=3,
                restore_best_weights=True
            ))

            history = self.model.fit(
                train_dataset,
                epochs=min(self.training_config.get("epochs", 10), settings.MAX_EPOCHS),
                validation_data=val_dataset,
                callbacks=callbacks,
                verbose=1
            )

            return history

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def evaluate(self, val_dataset: tf.data.Dataset) -> Dict[str, float]:
        """Evaluate the model on validation data"""
        if self.model is None:
            raise ValueError("Model not trained yet")

        results = self.model.evaluate(val_dataset, return_dict=True)
        return results

    def save_model(self, path: Union[str, Path]) -> None:
        """Save the trained model"""
        if self.model is None:
            raise ValueError("No model to save")

        # Save in TF SavedModel format for better memory efficiency
        self.model.save(path, save_format='tf')
        
        config_path = Path(path).parent / f"{Path(path).stem}_config.json"
        with open(config_path, 'w') as f:
            json.dump({
                'model_config': self.model_config,
                'training_config': self.training_config
            }, f)

    def load_model(self, path: Union[str, Path]) -> None:
        """Load a trained model"""
        # Use memory-efficient loading
        self.model = models.load_model(path, compile=False)
        
        config_path = Path(path).parent / f"{Path(path).stem}_config.json"
        with open(config_path, 'r') as f:
            configs = json.load(f)
            self.model_config = configs['model_config']
            self.training_config = configs['training_config']