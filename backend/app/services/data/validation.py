# app/services/data/validation.py
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class ValidationConfig(BaseModel):
    required_columns: List[str] = Field(default_factory=list)
    column_types: Dict[str, str] = Field(default_factory=dict)
    value_ranges: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    unique_columns: List[str] = Field(default_factory=list)
    max_missing_ratio: float = Field(default=0.2)

class DataValidator:
    def __init__(self, config: Optional[Dict] = None):
        self.config = ValidationConfig(**(config or {}))

    async def validate_dataset(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate dataset against configuration"""
        errors = []
        
        try:
            # Check required columns
            if self.config.required_columns:
                missing_cols = set(self.config.required_columns) - set(df.columns)
                if missing_cols:
                    errors.append(f"Missing required columns: {missing_cols}")

            # Check column types
            for col, expected_type in self.config.column_types.items():
                if col in df.columns:
                    if not self._check_column_type(df[col], expected_type):
                        errors.append(f"Column {col} has incorrect type. Expected {expected_type}")

            # Check value ranges
            for col, range_dict in self.config.value_ranges.items():
                if col in df.columns:
                    min_val = range_dict.get('min')
                    max_val = range_dict.get('max')
                    if min_val is not None and max_val is not None:
                        mask = ~df[col].between(min_val, max_val)
                        if mask.any():
                            errors.append(f"Column {col} has values outside range [{min_val}, {max_val}]")

            # Check missing values
            for col in df.columns:
                missing_ratio = df[col].isnull().mean()
                if missing_ratio > self.config.max_missing_ratio:
                    errors.append(f"Column {col} has {missing_ratio:.2%} missing values")

            # Check unique constraints
            for col in self.config.unique_columns:
                if col in df.columns and not df[col].is_unique:
                    errors.append(f"Column {col} contains duplicate values")

            return len(errors) == 0, errors

        except Exception as e:
            logger.error(f"Error validating dataset: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            return False, errors

    def _check_column_type(self, series: pd.Series, expected_type: str) -> bool:
        """Check if column data type matches expected type"""
        type_mapping = {
            'numeric': (np.number, float, int),
            'integer': (np.integer, int),
            'float': (np.floating, float),
            'string': (str, object),
            'boolean': (bool, np.bool_),
            'datetime': (np.datetime64, pd.Timestamp)
        }
        
        if expected_type not in type_mapping:
            return False
            
        return pd.api.types.is_dtype_type(series.dtype.type, type_mapping[expected_type])