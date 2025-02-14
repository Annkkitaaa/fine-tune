from typing import Dict, List, Optional, Union, Tuple
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.encoders = {}
        self.scalers = {}
        self._feature_stats = {}
        
    async def process_pipeline(
        self,
        data: Union[pd.DataFrame, np.ndarray],
        feature_names: Optional[List[str]] = None,
        save_path: Optional[str] = None
    ) -> Tuple[np.ndarray, Dict]:
        """
        Complete preprocessing pipeline with parallel processing capability
        """
        try:
            # Convert to DataFrame if numpy array
            if isinstance(data, np.ndarray):
                data = pd.DataFrame(data, columns=feature_names)
            
            # Initialize pipeline steps based on config
            steps = self._initialize_pipeline_steps()
            
            # Process in parallel where possible
            with ThreadPoolExecutor() as executor:
                # Handle missing values
                if steps.get('handle_missing'):
                    data = await self._handle_missing_values(data, executor)
                
                # Handle outliers
                if steps.get('handle_outliers'):
                    data = await self._handle_outliers(data, executor)
                
                # Feature engineering
                if steps.get('feature_engineering'):
                    data = await self._engineer_features(data)
                
                # Encode categorical variables
                if steps.get('encode_categorical'):
                    data = await self._encode_categorical(data, executor)
                
                # Scale numerical variables
                if steps.get('scale_numerical'):
                    data = await self._scale_numerical(data, executor)
            
            # Save processed data if path provided
            if save_path:
                await self._save_processed_data(data, save_path)
            
            return data.values, self._feature_stats
            
        except Exception as e:
            logger.error(f"Error in preprocessing pipeline: {str(e)}")
            raise
            
    def _initialize_pipeline_steps(self) -> Dict[str, bool]:
        """Initialize preprocessing pipeline steps based on configuration"""
        return {
            'handle_missing': self.config.get('handle_missing', True),
            'handle_outliers': self.config.get('handle_outliers', True),
            'feature_engineering': self.config.get('feature_engineering', False),
            'encode_categorical': self.config.get('encode_categorical', True),
            'scale_numerical': self.config.get('scale_numerical', True)
        }
    
    async def _handle_missing_values(
        self,
        df: pd.DataFrame,
        executor: ThreadPoolExecutor
    ) -> pd.DataFrame:
        """Handle missing values with parallel processing"""
        strategy = self.config.get('missing_values_strategy', 'mean')
        
        def process_column(col):
            if df[col].isnull().any():
                if pd.api.types.is_numeric_dtype(df[col]):
                    if strategy == 'mean':
                        return df[col].fillna(df[col].mean())
                    elif strategy == 'median':
                        return df[col].fillna(df[col].median())
                else:
                    return df[col].fillna(df[col].mode()[0])
            return df[col]
        
        # Process columns in parallel
        processed_columns = list(executor.map(process_column, df.columns))
        return pd.concat(processed_columns, axis=1)
    
    async def _handle_outliers(
        self,
        df: pd.DataFrame,
        executor: ThreadPoolExecutor
    ) -> pd.DataFrame:
        """Handle outliers with parallel processing"""
        threshold = self.config.get('outlier_threshold', 3)
        method = self.config.get('outlier_method', 'zscore')
        
        def process_column_outliers(col):
            if pd.api.types.is_numeric_dtype(df[col]):
                if method == 'zscore':
                    z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                    df[col] = df[col].mask(z_scores > threshold, df[col].median())
            return df[col]
        
        # Process columns in parallel
        processed_columns = list(executor.map(process_column_outliers, df.columns))
        return pd.concat(processed_columns, axis=1)
    
    async def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Custom feature engineering based on configuration"""
        if 'feature_interactions' in self.config:
            for col1, col2 in self.config['feature_interactions']:
                if col1 in df.columns and col2 in df.columns:
                    df[f"{col1}_{col2}_interaction"] = df[col1] * df[col2]
        
        return df
    
    async def _encode_categorical(
        self,
        df: pd.DataFrame,
        executor: ThreadPoolExecutor
    ) -> pd.DataFrame:
        """Encode categorical variables with parallel processing"""
        categorical_columns = df.select_dtypes(include=['object']).columns
        
        def encode_column(col):
            if col in categorical_columns:
                encoder = LabelEncoder()
                df[col] = encoder.fit_transform(df[col].astype(str))
                self.encoders[col] = encoder
            return df[col]
        
        # Process columns in parallel
        processed_columns = list(executor.map(encode_column, df.columns))
        return pd.concat(processed_columns, axis=1)
    
    async def _scale_numerical(
        self,
        df: pd.DataFrame,
        executor: ThreadPoolExecutor
    ) -> pd.DataFrame:
        """Scale numerical variables with parallel processing"""
        numerical_columns = df.select_dtypes(include=['int64', 'float64']).columns
        scaling_method = self.config.get('scaling_method', 'standard')
        
        def scale_column(col):
            if col in numerical_columns:
                scaler = StandardScaler()
                df[col] = scaler.fit_transform(df[[col]])
                self.scalers[col] = scaler
                
                # Store feature statistics
                self._feature_stats[col] = {
                    'mean': float(scaler.mean_),
                    'std': float(scaler.scale_),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
            return df[col]
        
        # Process columns in parallel
        processed_columns = list(executor.map(scale_column, df.columns))
        return pd.concat(processed_columns, axis=1)
    
    async def _save_processed_data(self, df: pd.DataFrame, save_path: str) -> None:
        """Save processed data with metadata"""
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Save data
        if save_path.endswith('.parquet'):
            df.to_parquet(save_path, index=False)
        else:
            df.to_csv(save_path, index=False)
        
        # Save metadata
        metadata_path = Path(save_path).with_suffix('.meta.json')
        metadata = {
            'feature_stats': self._feature_stats,
            'categorical_encoders': {k: v.__class__.__name__ for k, v in self.encoders.items()},
            'numerical_scalers': {k: v.__class__.__name__ for k, v in self.scalers.items()},
            'config': self.config
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)