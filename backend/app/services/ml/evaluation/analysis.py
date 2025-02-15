# app/services/ml/evaluation/analysis.py
from typing import Dict, List, Optional, Union
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
import logging
import plotly.graph_objects as go
from plotly.subplots import make_subplots

logger = logging.getLogger(__name__)

class DataAnalysisService:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self._analysis_results = {}

    def _ensure_dataframe(
        self,
        data: Union[pd.DataFrame, np.ndarray],
        feature_names: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Convert input data to pandas DataFrame"""
        if isinstance(data, pd.DataFrame):
            return data
        elif isinstance(data, np.ndarray):
            columns = feature_names if feature_names else [f'feature_{i}' for i in range(data.shape[1])]
            return pd.DataFrame(data, columns=columns)
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")

    async def analyze_dataset(
        self,
        data: Union[pd.DataFrame, np.ndarray],
        feature_names: Optional[List[str]] = None,
        target_column: Optional[str] = None  # Made optional
    ) -> Dict:
        """Analyze dataset and create visualizations"""
        try:
            # Convert to DataFrame if necessary
            df = self._ensure_dataframe(data, feature_names)

            # Basic statistics
            stats = await self._compute_basic_statistics(df)
            
            # Feature correlations
            correlations = await self._analyze_correlations(df)
            
            # Store results
            self._analysis_results = {
                'basic_statistics': stats,
                'correlations': correlations
            }
            
            return self._analysis_results

        except Exception as e:
            logger.error(f"Error in dataset analysis: {str(e)}")
            raise

    async def _compute_basic_statistics(self, df: pd.DataFrame) -> Dict:
        """Compute basic dataset statistics"""
        try:
            # Calculate basic statistics
            stats = {
                'summary': df.describe().to_dict(),
                'missing_values': df.isnull().sum().to_dict(),
                'data_types': df.dtypes.astype(str).to_dict(),
                'memory_usage': df.memory_usage(deep=True).sum()
            }

            # Create summary visualizations
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=(
                    'Missing Values',
                    'Data Types Distribution',
                    'Value Ranges',
                    'Memory Usage'
                ),
                specs=[
                    [{"type": "bar"}, {"type": "pie"}],
                    [{"type": "box"}, {"type": "bar"}]
                ]
            )

            # Missing values plot
            missing_values = df.isnull().sum()
            fig.add_trace(
                go.Bar(
                    x=list(missing_values.index),
                    y=list(missing_values.values),
                    name='Missing Values'
                ),
                row=1, col=1
            )

            # Data types distribution
            dtype_counts = df.dtypes.value_counts()
            fig.add_trace(
                go.Pie(
                    labels=list(dtype_counts.index.astype(str)),
                    values=list(dtype_counts.values),
                    name='Data Types'
                ),
                row=1, col=2
            )

            # Value ranges for numerical columns
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
            if len(numerical_cols) > 0:
                fig.add_trace(
                    go.Box(
                        x=list(numerical_cols),
                        y=df[numerical_cols].values.flatten(),
                        name='Value Ranges'
                    ),
                    row=2, col=1
                )

            # Memory usage by column
            memory_usage = df.memory_usage(deep=True)
            fig.add_trace(
                go.Bar(
                    x=list(memory_usage.index),
                    y=list(memory_usage.values / 1024),  # Convert to KB
                    name='Memory Usage (KB)'
                ),
                row=2, col=2
            )

            # Update layout
            fig.update_layout(
                height=800,
                showlegend=True,
                title_text="Dataset Analysis"
            )

            stats['visualizations'] = fig.to_dict()
            return stats

        except Exception as e:
            logger.error(f"Error computing basic statistics: {str(e)}")
            raise

    async def _analyze_correlations(self, df: pd.DataFrame) -> Optional[Dict]:
        """Analyze feature correlations"""
        try:
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
            
            if len(numerical_cols) > 1:
                corr_matrix = df[numerical_cols].corr()
                
                # Create correlation heatmap
                fig = go.Figure(data=go.Heatmap(
                    z=corr_matrix.values,
                    x=list(corr_matrix.columns),
                    y=list(corr_matrix.columns),
                    colorscale='RdBu',
                    zmin=-1,
                    zmax=1
                ))

                # Update layout
                fig.update_layout(
                    title='Feature Correlations',
                    xaxis_title='Features',
                    yaxis_title='Features',
                    height=600
                )
                
                return {
                    'correlation_matrix': corr_matrix.to_dict(),
                    'visualization': fig.to_dict()
                }
            
            return None

        except Exception as e:
            logger.error(f"Error analyzing correlations: {str(e)}")
            raise

    async def _analyze_distributions(self, df: pd.DataFrame) -> Dict:
        """Analyze feature distributions"""
        try:
            distributions = {}
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns

            for col in numerical_cols:
                # Create distribution plot
                fig = go.Figure()
                
                # Add histogram
                fig.add_trace(go.Histogram(
                    x=df[col],
                    name=col,
                    nbinsx=30
                ))

                # Update layout
                fig.update_layout(
                    title=f'Distribution of {col}',
                    xaxis_title=col,
                    yaxis_title='Count',
                    showlegend=True
                )

                # Calculate statistics
                stats = {
                    'mean': float(df[col].mean()),
                    'median': float(df[col].median()),
                    'std': float(df[col].std()),
                    'skew': float(df[col].skew()),
                    'kurtosis': float(df[col].kurtosis())
                }

                distributions[col] = {
                    'visualization': fig.to_dict(),
                    'statistics': stats
                }

            return distributions

        except Exception as e:
            logger.error(f"Error analyzing distributions: {str(e)}")
            raise

    def get_visualization(self, analysis_type: str, feature: Optional[str] = None) -> Dict:
        """Retrieve specific visualization from analysis results"""
        try:
            if analysis_type not in self._analysis_results:
                raise ValueError(f"Analysis type '{analysis_type}' not found in results")
                
            if feature:
                if feature not in self._analysis_results[analysis_type]:
                    raise ValueError(f"Feature '{feature}' not found in {analysis_type} analysis")
                return self._analysis_results[analysis_type][feature]['visualization']
                
            return self._analysis_results[analysis_type]['visualization']

        except Exception as e:
            logger.error(f"Error retrieving visualization: {str(e)}")
            raise