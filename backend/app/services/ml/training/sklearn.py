from sklearn.base import BaseEstimator
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, r2_score, mean_absolute_error
)
import joblib
from typing import Dict, Any, Optional, Union, List, Tuple
import numpy as np
import logging
from pathlib import Path
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class SklearnTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.model = None
        self.is_classifier = None
        self.feature_importance = None

    def prepare_data(self, X_train, y_train, X_val=None, y_val=None):
        return (X_train, y_train), (X_val, y_val) if X_val is not None and y_val is not None else (None, None)

    def _initialize_model(self) -> BaseEstimator:
        model_type = self.model_config.get("type", "random_forest")
        task = self.model_config.get("task", "regression")
        self.is_classifier = task == "classification"

        logger.debug(f"Initializing model: {model_type} for task: {task}")

        if model_type == "random_forest":
            if self.is_classifier:
                return RandomForestClassifier(
                    n_estimators=self.model_config.get("n_estimators", 100),
                    max_depth=self.model_config.get("max_depth"),
                    min_samples_split=self.model_config.get("min_samples_split", 2),
                    min_samples_leaf=self.model_config.get("min_samples_leaf", 1),
                    max_features=self.model_config.get("max_features", "auto"),
                    random_state=42
                )
            else:
                return RandomForestRegressor(
                    n_estimators=self.model_config.get("n_estimators", 100),
                    max_depth=self.model_config.get("max_depth"),
                    min_samples_split=self.model_config.get("min_samples_split", 2),
                    min_samples_leaf=self.model_config.get("min_samples_leaf", 1),
                    max_features=self.model_config.get("max_features", "sqrt"),
                    random_state=42
                )
        elif model_type == "linear":
            if self.is_classifier:
                return LogisticRegression(
                    C=self.model_config.get("C", 1.0),
                    max_iter=self.model_config.get("max_iter", 1000),
                    penalty=self.model_config.get("penalty", "l2"),
                    random_state=42
                )
            else:
                return LinearRegression(
                    fit_intercept=self.model_config.get("fit_intercept", True),
                    n_jobs=self.model_config.get("n_jobs", -1)
                )
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

    def _convert_to_numpy(self, data):
        """
        Converts input data to a numpy array, ensuring all rows have the same length.
        """
        logger.debug(f"Converting data to NumPy: {type(data)}")
        try:
            np_data = np.array(data, dtype=np.float32)
            logger.debug(f"Converted shape: {np_data.shape}")
            return np_data
        except ValueError as e:
            logger.warning(f"ValueError in conversion: {e}. Attempting shape correction.")

            max_len = max(len(row) if isinstance(row, (list, np.ndarray)) else 0 for row in data)
            fixed_data = np.array([
                np.pad(row, (0, max_len - len(row)), mode='constant') if isinstance(row, (list, np.ndarray)) and len(row) < max_len
                else row[:max_len] if isinstance(row, (list, np.ndarray))
                else np.zeros(max_len)
                for row in data
            ], dtype=np.float32)
            logger.debug(f"Fixed shape: {fixed_data.shape}")
            return fixed_data

    async def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None
    ) -> Tuple[BaseEstimator, Dict[str, Any]]:
        try:
            # Convert to NumPy to prevent sequence errors
            logger.debug("Converting training data to NumPy...")
            X_train = self._convert_to_numpy(X_train)
            y_train = self._convert_to_numpy(y_train)

            if X_val is not None and y_val is not None:
                logger.debug("Converting validation data to NumPy...")
                X_val = self._convert_to_numpy(X_val)
                y_val = self._convert_to_numpy(y_val)

            logger.info(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
            if X_val is not None and y_val is not None:
                logger.info(f"X_val shape: {X_val.shape}, y_val shape: {y_val.shape}")

            # Initialize and train model
            logger.debug("Initializing model...")
            self.model = self._initialize_model()
            logger.debug("Fitting model on training data...")
            self.model.fit(X_train, y_train)

            # Compute predictions
            train_pred = self.model.predict(X_train)
            metrics = self._compute_metrics(y_train, train_pred, prefix='train_')

            if X_val is not None and y_val is not None:
                val_pred = self.model.predict(X_val)
                metrics.update(self._compute_metrics(y_val, val_pred, prefix='val_'))

            logger.info("Training complete. Metrics computed.")
            return self.model, metrics

        except Exception as e:
            logger.error(f"Error during training: {str(e)}", exc_info=True)
            raise

    def _compute_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, prefix: str = "") -> Dict[str, float]:
        logger.debug(f"Computing metrics for {prefix}...")
        metrics = {}

        if self.is_classifier:
            metrics[f'{prefix}accuracy'] = accuracy_score(y_true, y_pred)
            metrics[f'{prefix}precision'] = precision_score(y_true, y_pred, average='weighted')
            metrics[f'{prefix}recall'] = recall_score(y_true, y_pred, average='weighted')
            metrics[f'{prefix}f1'] = f1_score(y_true, y_pred, average='weighted')
        else:
            metrics[f'{prefix}mse'] = mean_squared_error(y_true, y_pred)
            metrics[f'{prefix}rmse'] = np.sqrt(metrics[f'{prefix}mse'])
            metrics[f'{prefix}mae'] = mean_absolute_error(y_true, y_pred)
            metrics[f'{prefix}r2'] = r2_score(y_true, y_pred)

        logger.info(f"Metrics computed: {metrics}")
        return metrics

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model not trained yet")

        try:
            logger.debug("Converting prediction input to NumPy...")
            X = self._convert_to_numpy(X)
            logger.debug(f"Predicting with input shape: {X.shape}")
            return self.model.predict(X)
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}", exc_info=True)
            raise
