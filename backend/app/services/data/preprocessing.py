import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.encoders = {}
        self.scalers = {}
        self.imputers = {}

    async def process_dataset(self, file_path: Union[str, Path], save_path: Optional[str] = None) -> pd.DataFrame:
        """
        Process dataset with configured preprocessing steps
        """
        try:
            # Load data
            df = self._load_data(file_path)
            
            # Apply preprocessing steps
            df = self._handle_missing_values(df)
            df = self._encode_categorical(df)
            df = self._scale_numerical(df)
            
            # Save processed data if path provided
            if save_path:
                self._save_data(df, save_path)
            
            return df
            
        except Exception as e:
            logger.error(f"Error processing dataset: {str(e)}")
            raise

    def _load_data(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Load data from various file formats
        """
        file_path = str(file_path)
        try:
            if file_path.endswith('.csv'):
                return pd.read_csv(file_path)
            elif file_path.endswith('.parquet'):
                return pd.read_parquet(file_path)
            elif file_path.endswith(('.xls', '.xlsx')):
                return pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                return pd.read_json(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
        except Exception as e:
            logger.error(f"Error loading data from {file_path}: {str(e)}")
            raise

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Handle missing values based on configuration
        """
        strategy = self.config.get('missing_values_strategy', 'mean')
        
        for column in df.columns:
            if df[column].isnull().any():
                if pd.api.types.is_numeric_dtype(df[column]):
                    imputer = SimpleImputer(strategy=strategy)
                    df[column] = imputer.fit_transform(df[[column]])
                    self.imputers[column] = imputer
                else:
                    df[column] = df[column].fillna(df[column].mode()[0])
        
        return df

    def _encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Encode categorical variables
        """
        categorical_columns = df.select_dtypes(include=['object']).columns
        
        for column in categorical_columns:
            encoder = LabelEncoder()
            df[column] = encoder.fit_transform(df[column].astype(str))
            self.encoders[column] = encoder
        
        return df

    def _scale_numerical(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Scale numerical variables
        """
        numerical_columns = df.select_dtypes(include=['int64', 'float64']).columns
        scaling_method = self.config.get('scaling_method', 'standard')
        
        for column in numerical_columns:
            if scaling_method == 'standard':
                scaler = StandardScaler()
            else:
                scaler = MinMaxScaler()
            
            df[column] = scaler.fit_transform(df[[column]])
            self.scalers[column] = scaler
        
        return df

    def _save_data(self, df: pd.DataFrame, save_path: str) -> None:
        """
        Save processed data
        """
        if save_path.endswith('.csv'):
            df.to_csv(save_path, index=False)
        elif save_path.endswith('.parquet'):
            df.to_parquet(save_path, index=False)
        else:
            raise ValueError(f"Unsupported save format: {save_path}")