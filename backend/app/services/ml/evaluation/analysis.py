from typing import Dict, List, Optional, Union, Tuple, Any
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import logging
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

logger = logging.getLogger(__name__)

class DataAnalysisService:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self._analysis_results = {}
        
    async def analyze_dataset(
        self,
        data: Union[pd.DataFrame, np.ndarray],
        feature_names: Optional[List[str]] = None,
        target_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive dataset analysis with visualization
        """
        try:
            # Convert to DataFrame if numpy array
            if isinstance(data, np.ndarray):
                data = pd.DataFrame(
                    data,
                    columns=feature_names if feature_names else [f'feature_{i}' for i in range(data.shape[1])]
                )
            
            # Basic statistics
            stats = await self._compute_basic_statistics(data)
            
            # Feature correlations
            correlations = await self._analyze_correlations(data)
            
            # Distribution analysis
            distributions = await self._analyze_distributions(data)
            
            # Dimensionality reduction
            dimensionality = await self._reduce_dimensions(data)
            
            # Time series analysis if applicable
            time_series = None
            if self._has_time_column(data):
                time_series = await self._analyze_time_series(data)
            
            # Store results
            self._analysis_results = {
                'basic_statistics': stats,
                'correlations': correlations,
                'distributions': distributions,
                'dimensionality_reduction': dimensionality,
                'time_series': time_series
            }
            
            return self._analysis_results
            
        except Exception as e:
            logger.error(f"Error in dataset analysis: {str(e)}")
            raise
    
    async def _compute_basic_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Compute basic dataset statistics"""
        stats = {
            'summary': df.describe().to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'memory_usage': df.memory_usage(deep=True).sum(),
        }
        
        # Create summary visualizations
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=(
                'Missing Values',
                'Data Types Distribution',
                'Value Ranges',
                'Memory Usage by Column'
            )
        )
        
        # Missing values plot
        missing_values = df.isnull().sum()
        fig.add_trace(
            go.Bar(
                x=missing_values.index,
                y=missing_values.values,
                name='Missing Values'
            ),
            row=1, col=1
        )
        
        # Data types distribution
        dtype_counts = df.dtypes.value_counts()
        fig.add_trace(
            go.Pie(
                labels=dtype_counts.index.astype(str),
                values=dtype_counts.values,
                name='Data Types'
            ),
            row=1, col=2
        )
        
        # Value ranges for numerical columns
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        if len(numerical_cols) > 0:
            ranges = df[numerical_cols].agg(['min', 'max'])
            fig.add_trace(
                go.Box(
                    x=numerical_cols,
                    y=df[numerical_cols].values.flatten(),
                    name='Value Ranges'
                ),
                row=2, col=1
            )
        
        # Memory usage by column
        memory_usage = df.memory_usage(deep=True)
        fig.add_trace(
            go.Bar(
                x=memory_usage.index,
                y=memory_usage.values / 1024,  # Convert to KB
                name='Memory Usage (KB)'
            ),
            row=2, col=2
        )
        
        stats['visualizations'] = fig.to_dict()
        return stats
    
    async def _analyze_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze feature correlations"""
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        if len(numerical_cols) > 1:
            corr_matrix = df[numerical_cols].corr()
            
            # Create correlation heatmap
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale='RdBu',
                zmin=-1,
                zmax=1
            ))
            
            return {
                'correlation_matrix': corr_matrix.to_dict(),
                'visualization': fig.to_dict()
            }
        
        return None
    
    async def _analyze_distributions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze feature distributions"""
        distributions = {}
        
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                # Create distribution plot
                fig = go.Figure()
                fig.add_trace(go.Histogram(
                    x=df[column],
                    name=column,
                    nbinsx=30
                ))
                
                # Add KDE if enough unique values
                if df[column].nunique() > 10:
                    from scipy import stats
                    kde_x = np.linspace(df[column].min(), df[column].max(), 100)
                    kde = stats.gaussian_kde(df[column].dropna())
                    fig.add_trace(go.Scatter(
                        x=kde_x,
                        y=kde(kde_x) * len(df[column]) * (df[column].max() - df[column].min()) / 30,
                        name=f'{column} KDE',
                        line=dict(width=2)
                    ))
                
                distributions[column] = {
                    'visualization': fig.to_dict(),
                    'statistics': {
                        'skew': float(df[column].skew()),
                        'kurtosis': float(df[column].kurtosis()),
                        'unique_values': int(df[column].nunique())
                    }
                }
        
        return distributions
    
    async def _reduce_dimensions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform dimensionality reduction"""
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        if len(numerical_cols) > 2:
            # PCA
            pca = PCA(n_components=2)
            pca_result = pca.fit_transform(df[numerical_cols])
            
            # t-SNE
            tsne = TSNE(n_components=2, random_state=42)
            tsne_result = tsne.fit_transform(df[numerical_cols])
            
            # Create visualizations
            fig = make_subplots(
                rows=1, cols=2,
                subplot_titles=('PCA Projection', 't-SNE Projection')
            )
            
            fig.add_trace(
                go.Scatter(
                    x=pca_result[:, 0],
                    y=pca_result[:, 1],
                    mode='markers',
                    name='PCA'
                ),
                row=1, col=1
            )
            
            fig.add_trace(
                go.Scatter(
                    x=tsne_result[:, 0],
                    y=tsne_result[:, 1],
                    mode='markers',
                    name='t-SNE'
                ),
                row=1, col=2
            )
            
            return {
                'pca': {
                    'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
                    'components': pca.components_.tolist()
                },
                'visualization': fig.to_dict()
            }
        
        return None
    
    async def _analyze_time_series(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze time series patterns if applicable"""
        time_cols = df.select_dtypes(include=['datetime64']).columns
        
        if len(time_cols) > 0:
            time_col = time_cols[0]
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
            
            results = {}
            for col in numerical_cols:
                # Create time series plot
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df[time_col],
                    y=df[col],
                    mode='lines',
                    name=col
                ))
                
                # Add trend line
                z = np.polyfit(range(len(df)), df[col], 1)
                p = np.poly1d(z)
                fig.add_trace(go.Scatter(
                    x=df[time_col],
                    y=p(range(len(df))),
                    mode='lines',
                    name=f'{col} Trend',
                    line=dict(dash='dash')
                ))
                
                results[col] = {
                    'visualization': fig.to_dict(),
                    'trend_coefficient': float(z[0])
                }
            
            return results
        
        return None
    
    def _has_time_column(self, df: pd.DataFrame) -> bool:
        """Check if dataset has time-based columns"""
        return any(pd.api.types.is_datetime64_any_dtype(df[col]) for col in df.columns)
    
    def get_visualization(self, analysis_type: str, feature: Optional[str] = None) -> Dict:
        """Retrieve specific visualization from analysis results"""
        if analysis_type not in self._analysis_results:
            raise ValueError(f"Analysis type '{analysis_type}' not found in results")
            
        if feature:
            if feature not in self._analysis_results[analysis_type]:
                raise ValueError(f"Feature '{feature}' not found in {analysis_type} analysis")
            return self._analysis_results[analysis_type][feature]['visualization']
            
        return self._analysis_results[analysis_type]['visualization']