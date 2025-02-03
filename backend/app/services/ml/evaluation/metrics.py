# metrics.py
from typing import Dict, List, Optional, Union, Any
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error,
    mean_absolute_error, r2_score
)
import logging

logger = logging.getLogger(__name__)

class MetricsCalculator:
    @staticmethod
    def calculate_classification_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Calculate classification metrics
        """
        try:
            metrics = {
                'accuracy': accuracy_score(y_true, y_pred),
                'precision': precision_score(y_true, y_pred, average='weighted'),
                'recall': recall_score(y_true, y_pred, average='weighted'),
                'f1': f1_score(y_true, y_pred, average='weighted')
            }
            
            # Add ROC AUC if probabilities are provided
            if y_prob is not None:
                if y_prob.shape[1] == 2:  # Binary classification
                    metrics['roc_auc'] = roc_auc_score(y_true, y_prob[:, 1])
                else:  # Multi-class
                    metrics['roc_auc'] = roc_auc_score(
                        y_true,
                        y_prob,
                        multi_class='ovr',
                        average='weighted'
                    )
            
            # Add confusion matrix
            metrics['confusion_matrix'] = confusion_matrix(y_true, y_pred).tolist()
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating classification metrics: {str(e)}")
            raise

    @staticmethod
    def calculate_regression_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """
        Calculate regression metrics
        """
        try:
            mse = mean_squared_error(y_true, y_pred)
            
            metrics = {
                'mse': mse,
                'rmse': np.sqrt(mse),
                'mae': mean_absolute_error(y_true, y_pred),
                'r2': r2_score(y_true, y_pred),
                'explained_variance': np.var(y_pred) / np.var(y_true)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating regression metrics: {str(e)}")
            raise

    @staticmethod
    def calculate_custom_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        metric_fns: Dict[str, Callable]
    ) -> Dict[str, float]:
        """
        Calculate custom metrics
        """
        try:
            metrics = {}
            
            for metric_name, metric_fn in metric_fns.items():
                metrics[metric_name] = metric_fn(y_true, y_pred)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating custom metrics: {str(e)}")
            raise