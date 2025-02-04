from typing import Dict, List, Optional, Union, Any
import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_curve, roc_curve, confusion_matrix 
import logging
from pathlib import Path
import json
import matplotlib.pyplot as plt
import seaborn as sns

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
        """
        Comprehensive model prediction analysis
        """
        try:
            analysis = {}
            
            if is_classifier:
                analysis.update(self._analyze_classification(y_true, y_pred, y_prob))
            else:
                analysis.update(self._analyze_regression(y_true, y_pred))
            
            # Add feature importance analysis if provided
            if feature_importance is not None and feature_names is not None:
                analysis['feature_importance'] = self._analyze_feature_importance(
                    feature_names,
                    feature_importance
                )
            
            # Save analysis results if save_dir is provided
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
        """
        Analyze classification predictions
        """
        analysis = {
            'error_analysis': self._analyze_errors(y_true, y_pred)
        }
        
        if y_prob is not None:
            # Calculate and store ROC curve data
            if y_prob.shape[1] == 2:  # Binary classification
                fpr, tpr, thresholds = roc_curve(y_true, y_prob[:, 1])
                analysis['roc_curve'] = {
                    'fpr': fpr.tolist(),
                    'tpr': tpr.tolist(),
                    'thresholds': thresholds.tolist()
                }
            
            # Calculate and store precision-recall curve data
            precision, recall, thresholds = precision_recall_curve(y_true, y_prob[:, 1])
            analysis['pr_curve'] = {
                'precision': precision.tolist(),
                'recall': recall.tolist(),
                'thresholds': thresholds.tolist()
            }
            
            # Add probability distribution analysis
            analysis['probability_distribution'] = self._analyze_probability_distribution(y_prob)
        
        # Add confusion matrix visualization
        conf_matrix = confusion_matrix(y_true, y_pred)
        analysis['confusion_matrix'] = {
            'matrix': conf_matrix.tolist(),
            'visualization': self._plot_confusion_matrix(conf_matrix)
        }
        
        return analysis

    def _analyze_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze regression predictions
        """
        analysis = {
            'residuals': self._analyze_residuals(y_true, y_pred),
            'error_distribution': self._analyze_error_distribution(y_true, y_pred),
            'prediction_scatter': self._create_prediction_scatter(y_true, y_pred)
        }
        
        # Add quantile analysis
        analysis['quantile_analysis'] = self._analyze_quantiles(y_true, y_pred)
        
        return analysis

    def _analyze_errors(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze prediction errors
        """
        errors = {
            'misclassified_indices': np.where(y_true != y_pred)[0].tolist(),
            'error_rate': (y_true != y_pred).mean(),
            'error_distribution': pd.Series(y_true != y_pred).value_counts().to_dict()
        }
        
        return errors

    def _analyze_probability_distribution(
        self,
        y_prob: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze prediction probability distributions
        """
        analysis = {
            'mean_confidence': np.mean(np.max(y_prob, axis=1)),
            'confidence_histogram': np.histogram(np.max(y_prob, axis=1), bins=10)[0].tolist(),
            'class_probabilities': {
                f'class_{i}': {
                    'mean': float(np.mean(y_prob[:, i])),
                    'std': float(np.std(y_prob[:, i])),
                    'histogram': np.histogram(y_prob[:, i], bins=10)[0].tolist()
                }
                for i in range(y_prob.shape[1])
            }
        }
        
        return analysis

    def _analyze_residuals(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze regression residuals
        """
        residuals = y_true - y_pred
        
        analysis = {
            'mean_residual': float(np.mean(residuals)),
            'std_residual': float(np.std(residuals)),
            'residual_range': [float(np.min(residuals)), float(np.max(residuals))],
            'residual_histogram': np.histogram(residuals, bins=30)[0].tolist()
        }
        
        # Add residual plot
        if self.save_dir:
            plt.figure(figsize=(10, 6))
            plt.scatter(y_pred, residuals, alpha=0.5)
            plt.xlabel('Predicted Values')
            plt.ylabel('Residuals')
            plt.title('Residual Plot')
            plt.savefig(self.save_dir / 'residual_plot.png')
            plt.close()
            
            analysis['residual_plot_path'] = str(self.save_dir / 'residual_plot.png')
        
        return analysis

    def _analyze_error_distribution(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze distribution of prediction errors
        """
        errors = np.abs(y_true - y_pred)
        
        analysis = {
            'mean_absolute_error': float(np.mean(errors)),
            'error_percentiles': {
                'p25': float(np.percentile(errors, 25)),
                'p50': float(np.percentile(errors, 50)),
                'p75': float(np.percentile(errors, 75)),
                'p90': float(np.percentile(errors, 90))
            },
            'error_histogram': np.histogram(errors, bins=30)[0].tolist()
        }
        
        return analysis

    def _create_prediction_scatter(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Create scatter plot of predicted vs actual values
        """
        if self.save_dir:
            plt.figure(figsize=(10, 6))
            plt.scatter(y_true, y_pred, alpha=0.5)
            plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--')
            plt.xlabel('Actual Values')
            plt.ylabel('Predicted Values')
            plt.title('Predicted vs Actual Values')
            plt.savefig(self.save_dir / 'prediction_scatter.png')
            plt.close()
            
            return {'scatter_plot_path': str(self.save_dir / 'prediction_scatter.png')}
        
        return {}

    def _analyze_quantiles(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        n_quantiles: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze prediction errors across different quantiles
        """
        df = pd.DataFrame({
            'true': y_true,
            'pred': y_pred,
            'error': np.abs(y_true - y_pred)
        })
        
        df['quantile'] = pd.qcut(df['true'], n_quantiles, labels=False)
        
        quantile_analysis = df.groupby('quantile').agg({
            'true': ['mean', 'count'],
            'pred': 'mean',
            'error': ['mean', 'std']
        }).round(4)
        
        return {
            'quantile_stats': quantile_analysis.to_dict(orient='index'),
            'n_quantiles': n_quantiles
        }

    def _analyze_feature_importance(
        self,
        feature_names: List[str],
        feature_importance: np.ndarray
    ) -> Dict[str, Any]:
        """
        Analyze feature importance scores
        """
        importance_dict = dict(zip(feature_names, feature_importance))
        sorted_importance = sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        analysis = {
            'feature_importance_dict': importance_dict,
            'top_features': sorted_importance[:10],
            'bottom_features': sorted_importance[-10:],
            'importance_statistics': {
                'mean': float(np.mean(feature_importance)),
                'std': float(np.std(feature_importance)),
                'max': float(np.max(feature_importance)),
                'min': float(np.min(feature_importance))
            }
        }
        
        # Create feature importance plot
        if self.save_dir:
            plt.figure(figsize=(12, 6))
            features, importance = zip(*sorted_importance[:20])  # Top 20 features
            plt.barh(features, importance)
            plt.xlabel('Importance Score')
            plt.title('Top 20 Feature Importance')
            plt.tight_layout()
            plt.savefig(self.save_dir / 'feature_importance.png')
            plt.close()
            
            analysis['feature_importance_plot'] = str(self.save_dir / 'feature_importance.png')
        
        return analysis

    def _plot_confusion_matrix(
        self,
        conf_matrix: np.ndarray
    ) -> Optional[str]:
        """
        Create and save confusion matrix visualization
        """
        if self.save_dir:
            plt.figure(figsize=(10, 8))
            sns.heatmap(
                conf_matrix,
                annot=True,
                fmt='d',
                cmap='Blues',
                cbar=True
            )
            plt.title('Confusion Matrix')
            plt.tight_layout()
            
            plot_path = self.save_dir / 'confusion_matrix.png'
            plt.savefig(plot_path)
            plt.close()
            
            return str(plot_path)
        
        return None

    def _save_analysis(self, analysis: Dict[str, Any]) -> None:
        """
        Save analysis results to JSON
        """
        if self.save_dir:
            self.save_dir.mkdir(parents=True, exist_ok=True)
            
            # Save analysis results
            with open(self.save_dir / 'analysis_results.json', 'w') as f:
                json.dump(analysis, f, indent=4)
            
            logger.info(f"Analysis results saved to {self.save_dir}")

    @staticmethod
    def generate_analysis_report(analysis: Dict[str, Any]) -> str:
        """
        Generate a text report from analysis results
        """
        report = ["Model Analysis Report", "=" * 20, ""]
        
        # Add classification-specific metrics
        if 'error_analysis' in analysis:
            report.extend([
                "Classification Metrics:",
                "-" * 20,
                f"Error Rate: {analysis['error_analysis']['error_rate']:.4f}",
                f"Number of Misclassifications: {len(analysis['error_analysis']['misclassified_indices'])}",
                ""
            ])
        
        # Add regression-specific metrics
        if 'residuals' in analysis:
            report.extend([
                "Regression Metrics:",
                "-" * 20,
                f"Mean Residual: {analysis['residuals']['mean_residual']:.4f}",
                f"Residual Std: {analysis['residuals']['std_residual']:.4f}",
                ""
            ])
        
        # Add feature importance summary if available
        if 'feature_importance' in analysis:
            top_features = analysis['feature_importance']['top_features'][:5]
            report.extend([
                "Top 5 Important Features:",
                "-" * 20
            ])
            for feature, importance in top_features:
                report.append(f"{feature}: {importance:.4f}")
        
        return "\n".join(report)