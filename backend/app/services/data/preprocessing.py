# app/services/data/preprocessing.py
from typing import Dict, List, Optional, Union, Tuple
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging
from pathlib import Path
import os
import json

logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.encoders = {}
        self.scalers = {}
        self._feature_stats = {}

    def _ensure_dataframe(
        self,
        data: Union[pd.DataFrame, np.ndarray, str, Path],
        feature_names: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Convert input data to pandas DataFrame"""
        if isinstance(data, pd.DataFrame):
            return data
        elif isinstance(data, np.ndarray):
            columns = feature_names if feature_names else [f'feature_{i}' for i in range(data.shape[1])]
            return pd.DataFrame(data, columns=columns)
        elif isinstance(data, (str, Path)):
            return self._load_data(data)
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")

    def _load_data(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """Load data from file"""
        file_path = str(file_path)
        
        if file_path.endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.endswith('.parquet'):
            return pd.read_parquet(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path}")

    async def process_pipeline(
        self,
        data: Union[pd.DataFrame, np.ndarray, str, Path],
        feature_names: Optional[List[str]] = None,
        save_path: Optional[Union[str, Path]] = None
    ) -> Tuple[np.ndarray, Dict]:
        """Complete preprocessing pipeline"""
        try:
            # Convert input to DataFrame
            df = self._ensure_dataframe(data, feature_names)

            # Initialize steps based on config
            steps = {
                'handle_missing': self.config.get('handle_missing', True),
                'handle_outliers': self.config.get('handle_outliers', True),
                'feature_engineering': self.config.get('feature_engineering', False),
                'scaling': self.config.get('scaling', True)
            }

            # Apply preprocessing steps
            if steps['handle_missing']:
                df = await self._handle_missing_values(df)

            if steps['handle_outliers']:
                df = await self._handle_outliers(df)

            if steps['feature_engineering']:
                df = await self._engineer_features(df)

            if steps['scaling']:
                df = await self._scale_features(df)

            # Save processed data if path provided
            if save_path:
                self._save_processed_data(df, save_path)

            return df.values, self._feature_stats

        except Exception as e:
            logger.error(f"Error in preprocessing pipeline: {str(e)}")
            raise

    async def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values"""
        try:
            strategy = self.config.get('missing_strategy', 'mean')
            
            for col in df.columns:
                if df[col].isnull().any():
                    if pd.api.types.is_numeric_dtype(df[col]):
                        if strategy == 'mean':
                            df[col] = df[col].fillna(df[col].mean())
                        elif strategy == 'median':
                            df[col] = df[col].fillna(df[col].median())
                        elif strategy == 'zero':
                            df[col] = df[col].fillna(0)
                    else:
                        df[col] = df[col].fillna(df[col].mode().iloc[0])
            
            return df
        except Exception as e:
            logger.error(f"Error handling missing values: {str(e)}")
            raise

    async def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers"""
        try:
            threshold = self.config.get('outlier_threshold', 3)
            method = self.config.get('outlier_method', 'zscore')
            
            if method == 'zscore':
                for col in df.select_dtypes(include=[np.number]).columns:
                    z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                    df.loc[z_scores > threshold, col] = df[col].median()
            
            return df
        except Exception as e:
            logger.error(f"Error handling outliers: {str(e)}")
            raise

    async def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features"""
        try:
            if 'interactions' in self.config:
                for col1, col2 in self.config['interactions']:
                    if col1 in df.columns and col2 in df.columns:
                        df[f"{col1}_{col2}_interaction"] = df[col1] * df[col2]
            
            return df
        except Exception as e:
            logger.error(f"Error engineering features: {str(e)}")
            raise

    async def _scale_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical features"""
        try:
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numerical_cols:
                scaler = StandardScaler()
                df[col] = scaler.fit_transform(df[[col]])
                self.scalers[col] = scaler
                
                self._feature_stats[col] = {
                    'mean': float(scaler.mean_),
                    'std': float(scaler.scale_),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
            
            return df
        except Exception as e:
            logger.error(f"Error scaling features: {str(e)}")
            raise

    def _save_processed_data(self, df: pd.DataFrame, save_path: Union[str, Path]) -> None:
        """Save processed data"""
        try:
            save_path = Path(save_path)
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            if str(save_path).endswith('.parquet'):
                df.to_parquet(save_path)
            else:
                df.to_csv(save_path, index=False)

            # Save feature statistics
            stats_path = save_path.parent / 'feature_stats.json'
            with open(stats_path, 'w') as f:
                json.dump(self._feature_stats, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving processed data: {str(e)}")
            raise