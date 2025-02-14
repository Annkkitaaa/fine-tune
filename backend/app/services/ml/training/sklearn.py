# sklearn.py
from sklearn.base import BaseEstimator
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import cross_val_score, KFold
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

logger = logging.getLogger(__name__)

class SklearnTrainer:
    def __init__(self, model_config: Dict[str, Any], training_config: Dict[str, Any]):
        self.model_config = model_config
        self.training_config = training_config
        self.model = None
        self.is_classifier = None
        self.feature_importance = None

    def _initialize_model(self) -> BaseEstimator:
        """
        Initialize scikit-learn model based on configuration
        """
        model_type = self.model_config.get("type", "random_forest")
        task = self.model_config.get("task", "regression")
        self.is_classifier = task == "classification"

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
                    max_features=self.model_config.get("max_features", "auto"),
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

    def _compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        prefix: str = ""
    ) -> Dict[str, float]:
        """
        Compute evaluation metrics based on task type
        """
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
        
        return metrics

    def _extract_feature_importance(self, feature_names: Optional[List[str]] = None) -> Dict[str, float]:
        """
        Extract feature importance if available
        """
        if not hasattr(self.model, 'feature_importances_'):
            return None
        
        importances = self.model.feature_importances_
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(importances))]
        
        return dict(zip(feature_names, importances))

    async def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None
    ) -> Tuple[BaseEstimator, Dict[str, Any]]:
        """
        Train the scikit-learn model and return both model and metrics
        """
        try:
            # Initialize and train model
            self.model = self._initialize_model()
            self.model.fit(X_train, y_train)
            
            # Compute predictions
            train_pred = self.model.predict(X_train)
            
            # Initialize metrics dictionary
            metrics = {}
            
            # Compute training metrics
            metrics.update(self._compute_metrics(y_train, train_pred, prefix='train_'))
            
            # Compute validation metrics if validation data is provided
            if X_val is not None and y_val is not None:
                val_pred = self.model.predict(X_val)
                metrics.update(self._compute_metrics(y_val, val_pred, prefix='val_'))
            
            # Perform cross-validation if specified
            if self.training_config.get('cross_validation', False):
                cv = self.training_config.get('cv_folds', 5)
                scoring = 'accuracy' if self.is_classifier else 'r2'
                cv_scores = cross_val_score(
                    self.model,
                    X_train,
                    y_train,
                    cv=cv,
                    scoring=scoring
                )
                metrics['cv_mean'] = cv_scores.mean()
                metrics['cv_std'] = cv_scores.std()
            
            # Extract feature importance
            self.feature_importance = self._extract_feature_importance(feature_names)
            if self.feature_importance:
                metrics['feature_importance'] = self.feature_importance
            
            # Return both model and metrics
            return self.model, metrics
            
        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise


    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, float]:
        """
        Evaluate the model on test data
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        try:
            y_pred = self.model.predict(X_test)
            metrics = self._compute_metrics(y_test, y_pred, prefix='test_')
            return metrics
            
        except Exception as e:
            logger.error(f"Error during evaluation: {str(e)}")
            raise

    def predict(
        self,
        X: np.ndarray,
        return_proba: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """
        Make predictions using the trained model
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        try:
            predictions = self.model.predict(X)
            
            if return_proba and self.is_classifier and hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(X)
                return predictions, probabilities
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise

    def save_model(self, path: Union[str, Path]) -> None:
        """
        Save the trained model and configurations
        """
        if self.model is None:
            raise ValueError("No model to save")
        
        try:
            # Create directory if it doesn't exist
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            
            # Save model
            joblib.dump(self.model, path)
            
            # Save configurations and feature importance
            config_path = Path(path).parent / f"{Path(path).stem}_config.json"
            config_data = {
                'model_config': self.model_config,
                'training_config': self.training_config,
                'feature_importance': self.feature_importance,
                'is_classifier': self.is_classifier
            }
            
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=4)
                
            logger.info(f"Model saved successfully to {path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: Union[str, Path]) -> None:
        """
        Load a trained model and configurations
        """
        try:
            # Load model
            self.model = joblib.load(path)
            
            # Load configurations
            config_path = Path(path).parent / f"{Path(path).stem}_config.json"
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                
            self.model_config = config_data['model_config']
            self.training_config = config_data['training_config']
            self.feature_importance = config_data['feature_importance']
            self.is_classifier = config_data['is_classifier']
            
            logger.info(f"Model loaded successfully from {path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise