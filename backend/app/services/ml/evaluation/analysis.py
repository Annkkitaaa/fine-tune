from typing import Dict, List, Optional, Union, Any
import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_curve, roc_curve, confusion_matrix
import logging
from pathlib import Path
import json
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

logger = logging.getLogger(__name__)

class ModelAnalyzer:
    def __init__(self, save_dir: Optional[Union[str, Path]] = None):
        self.save_dir = Path(save_dir) if save_dir else None

    def analyze_predictions(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
        is_classifier: bool = True,
        feature_names: Optional[List[str]] = None,
        feature_importance: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Comprehensive model prediction analysis"""
        try:
            analysis = {}
            
            if is_classifier:
                analysis.update(self._analyze_classification(y_true, y_pred, y_prob))
            else:
                analysis.update(self._analyze_regression(y_true, y_pred))
            
            if feature_importance is not None and feature_names is not None:
                analysis['feature_importance'] = self._analyze_feature_importance(
                    feature_names,
                    feature_importance
                )
            
            if self.save_dir:
                self._save_analysis(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error during prediction analysis: {str(e)}")
            raise

    def _analyze_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray]
    ) -> Dict[str, Any]:
        """Analyze classification predictions"""
        analysis = {
            'error_analysis': self._analyze_errors(y_true, y_pred)
        }
        
        if y_prob is not None:
            if y_prob.shape[1] == 2:  # Binary classification
                fpr, tpr, thresholds = roc_curve(y_true, y_prob[:, 1])
                analysis['roc_curve'] = {
                    'plot': self._create_roc_curve(fpr, tpr),
                    'data': {
                        'fpr': fpr.tolist(),
                        'tpr': tpr.tolist(),
                        'thresholds': thresholds.tolist()
                    }
                }
            
            precision, recall, thresholds = precision_recall_curve(y_true, y_prob[:, 1])
            analysis['pr_curve'] = {
                'plot': self._create_pr_curve(precision, recall),
                'data': {
                    'precision': precision.tolist(),
                    'recall': recall.tolist(),
                    'thresholds': thresholds.tolist()
                }
            }
            
            analysis['probability_distribution'] = self._analyze_probability_distribution(y_prob)
        
        conf_matrix = confusion_matrix(y_true, y_pred)
        analysis['confusion_matrix'] = {
            'plot': self._create_confusion_matrix(conf_matrix),
            'data': conf_matrix.tolist()
        }
        
        return analysis

    def _analyze_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """Analyze regression predictions"""
        analysis = {
            'residuals': self._analyze_residuals(y_true, y_pred),
            'error_distribution': self._analyze_error_distribution(y_true, y_pred),
            'prediction_scatter': self._create_prediction_scatter(y_true, y_pred)
        }
        
        analysis['quantile_analysis'] = self._analyze_quantiles(y_true, y_pred)
        return analysis

    def _create_roc_curve(self, fpr: np.ndarray, tpr: np.ndarray) -> Dict:
        """Create ROC curve plot"""
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=fpr, y=tpr,
            mode='lines',
            name='ROC Curve'
        ))
        fig.add_trace(go.Scatter(
            x=[0, 1], y=[0, 1],
            mode='lines',
            line=dict(dash='dash'),
            name='Random'
        ))
        fig.update_layout(
            title='ROC Curve',
            xaxis_title='False Positive Rate',
            yaxis_title='True Positive Rate'
        )
        return fig.to_dict()

    def _create_pr_curve(self, precision: np.ndarray, recall: np.ndarray) -> Dict:
        """Create Precision-Recall curve plot"""
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=recall, y=precision,
            mode='lines',
            name='PR Curve'
        ))
        fig.update_layout(
            title='Precision-Recall Curve',
            xaxis_title='Recall',
            yaxis_title='Precision'
        )
        return fig.to_dict()

    def _create_confusion_matrix(self, conf_matrix: np.ndarray) -> Dict:
        """Create confusion matrix heatmap"""
        fig = px.imshow(
            conf_matrix,
            labels=dict(x="Predicted", y="Actual", color="Count"),
            text=conf_matrix
        )
        fig.update_layout(title='Confusion Matrix')
        return fig.to_dict()

    def _create_prediction_scatter(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """Create scatter plot of predicted vs actual values"""
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=y_true, y=y_pred,
            mode='markers',
            name='Predictions'
        ))
        
        # Add diagonal line
        min_val = min(y_true.min(), y_pred.min())
        max_val = max(y_true.max(), y_pred.max())
        fig.add_trace(go.Scatter(
            x=[min_val, max_val],
            y=[min_val, max_val],
            mode='lines',
            line=dict(dash='dash'),
            name='Perfect Prediction'
        ))
        
        fig.update_layout(
            title='Predicted vs Actual Values',
            xaxis_title='Actual Values',
            yaxis_title='Predicted Values'
        )
        
        return {
            'plot': fig.to_dict(),
            'metrics': {
                'min_actual': float(y_true.min()),
                'max_actual': float(y_true.max()),
                'min_pred': float(y_pred.min()),
                'max_pred': float(y_pred.max())
            }
        }

    # Rest of the methods remain the same but return data instead of plots
    def _analyze_errors(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        return {
            'misclassified_indices': np.where(y_true != y_pred)[0].tolist(),
            'error_rate': float((y_true != y_pred).mean()),
            'error_distribution': pd.Series(y_true != y_pred).value_counts().to_dict()
        }

    def _analyze_probability_distribution(self, y_prob: np.ndarray) -> Dict[str, Any]:
        return {
            'mean_confidence': float(np.mean(np.max(y_prob, axis=1))),
            'class_probabilities': {
                f'class_{i}': {
                    'mean': float(np.mean(y_prob[:, i])),
                    'std': float(np.std(y_prob[:, i]))
                }
                for i in range(y_prob.shape[1])
            }
        }

    def _analyze_feature_importance(
        self,
        feature_names: List[str],
        feature_importance: np.ndarray
    ) -> Dict[str, Any]:
        importance_dict = dict(zip(feature_names, feature_importance))
        sorted_importance = sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Create feature importance plot with plotly
        top_20_features = sorted_importance[:20]
        fig = go.Figure(go.Bar(
            x=[imp for _, imp in top_20_features],
            y=[name for name, _ in top_20_features],
            orientation='h'
        ))
        fig.update_layout(
            title='Top 20 Feature Importance',
            xaxis_title='Importance Score',
            yaxis_title='Features'
        )
        
        return {
            'plot': fig.to_dict(),
            'data': {
                'feature_importance_dict': importance_dict,
                'top_features': sorted_importance[:10],
                'bottom_features': sorted_importance[-10:],
                'statistics': {
                    'mean': float(np.mean(feature_importance)),
                    'std': float(np.std(feature_importance)),
                    'max': float(np.max(feature_importance)),
                    'min': float(np.min(feature_importance))
                }
            }
        }

    def _save_analysis(self, analysis: Dict[str, Any]) -> None:
        """Save analysis results to JSON"""
        if self.save_dir:
            self.save_dir.mkdir(parents=True, exist_ok=True)
            with open(self.save_dir / 'analysis_results.json', 'w') as f:
                json.dump(analysis, f, indent=4)
            logger.info(f"Analysis results saved to {self.save_dir}")