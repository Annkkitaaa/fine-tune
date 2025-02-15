# app/services/ml/training/sklearn.py
import numpy as np
from sklearn.base import BaseEstimator
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import logging
from typing import Dict, Any, Optional, Union, List, Tuple
import pandas as pd

logger = logging.getLogger(__name__)

class SklearnTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.model = None
        self.is_classifier = model_config.get("task", "regression") == "classification"
        self.feature_importance = None
    
    def prepare_data(self, X_train, y_train, X_val=None, y_val=None):
        return (X_train, y_train), (X_val, y_val) if X_val is not None and y_val is not None else (None, None)


    def _convert_to_numpy(self, data: Any) -> np.ndarray:
        """Convert input data to numpy array safely"""
        logger.debug(f"Converting data to NumPy: {type(data)}")
        
        try:
            if isinstance(data, np.ndarray):
                return data
            elif isinstance(data, pd.DataFrame):
                return data.values
            elif isinstance(data, (list, tuple)):
                # Handle list/tuple of arrays or dataframes
                if len(data) == 2:  # Assuming data is (X, y) tuple
                    X, y = data
                    if isinstance(X, pd.DataFrame):
                        X = X.values
                    if isinstance(y, pd.Series):
                        y = y.values
                    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)
                
            # Try direct conversion
            return np.array(data, dtype=np.float32)
            
        except ValueError as e:
            logger.warning(f"ValueError in conversion: {str(e)}. Attempting shape correction.")
            try:
                # Handle potential ragged arrays
                if isinstance(data, (list, tuple)):
                    # Ensure all rows have same length by padding if necessary
                    max_length = max(len(row) if isinstance(row, (list, tuple)) else 1 for row in data)
                    fixed_data = []
                    for row in data:
                        if isinstance(row, (list, tuple)):
                            # Pad shorter rows with zeros
                            padded_row = list(row) + [0] * (max_length - len(row))
                            fixed_data.append(padded_row)
                        else:
                            # Handle scalar values
                            fixed_data.append([float(row)] + [0] * (max_length - 1))
                    return np.array(fixed_data, dtype=np.float32)
                return np.array(data, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error converting data to NumPy: {str(e)}")
                raise

    def _initialize_model(self) -> BaseEstimator:
        """Initialize scikit-learn model based on configuration"""
        model_type = self.model_config.get("type", "random_forest")
        
        if model_type == "random_forest":
            if self.is_classifier:
                return RandomForestClassifier(
                    n_estimators=self.model_config.get("n_estimators", 100),
                    max_depth=self.model_config.get("max_depth"),
                    random_state=42
                )
            else:
                return RandomForestRegressor(
                    n_estimators=self.model_config.get("n_estimators", 100),
                    max_depth=self.model_config.get("max_depth"),
                    random_state=42
                )
        elif model_type == "linear":
            if self.is_classifier:
                return LogisticRegression(
                    max_iter=self.model_config.get("max_iter", 1000),
                    random_state=42
                )
            else:
                return LinearRegression()
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

    async def train(
        self,
        train_loader: Any,
        val_loader: Optional[Any] = None
    ) -> Tuple[BaseEstimator, Dict[str, Any]]:
        """Train the scikit-learn model"""
        try:
            logger.debug("Converting training data to NumPy...")
            
            # Handle different input formats
            if isinstance(train_loader, (tuple, list)) and len(train_loader) == 2:
                X_train, y_train = train_loader
            else:
                raise ValueError("Expected train_loader to be a tuple of (X, y)")

            # Convert data to numpy arrays
            if isinstance(X_train, pd.DataFrame):
                X_train = X_train.values
            if isinstance(y_train, pd.Series):
                y_train = y_train.values

            # Initialize model
            self.model = self._initialize_model()
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Calculate training metrics
            y_pred = self.model.predict(X_train)
            metrics = self._compute_metrics(y_train, y_pred)
            
            # Add validation metrics if validation data is provided
            if val_loader is not None:
                if isinstance(val_loader, (tuple, list)) and len(val_loader) == 2:
                    X_val, y_val = val_loader
                    if isinstance(X_val, pd.DataFrame):
                        X_val = X_val.values
                    if isinstance(y_val, pd.Series):
                        y_val = y_val.values
                    
                    val_pred = self.model.predict(X_val)
                    val_metrics = self._compute_metrics(y_val, val_pred, prefix="val_")
                    metrics.update(val_metrics)

            # Extract feature importance if available
            if hasattr(self.model, "feature_importances_"):
                self.feature_importance = self.model.feature_importances_
                metrics["feature_importance"] = self.feature_importance.tolist()

            return self.model, metrics
            
        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def _compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        prefix: str = ""
    ) -> Dict[str, float]:
        """Compute evaluation metrics"""
        if self.is_classifier:
            return {
                f"{prefix}accuracy": float(accuracy_score(y_true, y_pred)),
                f"{prefix}precision": float(precision_score(y_true, y_pred, average='weighted')),
                f"{prefix}recall": float(recall_score(y_true, y_pred, average='weighted')),
                f"{prefix}f1": float(f1_score(y_true, y_pred, average='weighted'))
            }
        else:
            return {
                f"{prefix}mse": float(((y_true - y_pred) ** 2).mean()),
                f"{prefix}rmse": float(np.sqrt(((y_true - y_pred) ** 2).mean())),
                f"{prefix}mae": float(np.abs(y_true - y_pred).mean()),
                f"{prefix}r2": float(1 - (((y_true - y_pred) ** 2).sum() / ((y_true - y_true.mean()) ** 2).sum()))
            }