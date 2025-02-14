
# validation.py
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, validator
import logging

logger = logging.getLogger(__name__)

class DataValidationConfig(BaseModel):
    required_columns: Dict[str, bool]
    column_types: Dict[str, str]
    value_ranges: Dict[str, Dict[str, float]]  # Example: {"feature1": {"min": 0.0, "max": 10.0}}
    unique_columns: Dict[str, bool]

class DataValidator:
    def __init__(self, config: Optional[DataValidationConfig] = None):
        self.config = config or DataValidationConfig()

    async def validate_dataset(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate dataset against configuration
        """
        errors = []
        
        try:
            # Check required columns
            if self.config.required_columns:
                errors.extend(self._check_required_columns(df))
            
            # Check column types
            if self.config.column_types:
                errors.extend(self._check_column_types(df))
            
            # Check value ranges
            if self.config.value_ranges:
                errors.extend(self._check_value_ranges(df))
            
            # Check unique constraints
            if self.config.unique_columns:
                errors.extend(self._check_unique_constraints(df))
            
            # Check missing values
            errors.extend(self._check_missing_values(df))
            
            # Additional checks
            errors.extend(self._check_data_quality(df))
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Error validating dataset: {str(e)}")
            raise

    def _check_required_columns(self, df: pd.DataFrame) -> List[str]:
        """
        Check if required columns are present
        """
        errors = []
        missing_columns = set(self.config.required_columns) - set(df.columns)
        
        if missing_columns:
            errors.append(f"Missing required columns: {', '.join(missing_columns)}")
        
        return errors

    def _check_column_types(self, df: pd.DataFrame) -> List[str]:
        """
        Check column data types
        """
        errors = []
        
        for column, expected_type in self.config.column_types.items():
            if column in df.columns:
                actual_type = df[column].dtype
                if not self._is_compatible_type(actual_type, expected_type):
                    errors.append(f"Column {column} has type {actual_type}, expected {expected_type}")
        
        return errors

    def _check_value_ranges(self, df: pd.DataFrame) -> List[str]:
        """
        Check if values are within specified ranges
        """
        errors = []
        
        for column, (min_val, max_val) in self.config.value_ranges.items():
            if column in df.columns:
                out_of_range = df[
                    (df[column] < min_val) | (df[column] > max_val)
                ].index
                
                if len(out_of_range) > 0:
                    errors.append(
                        f"Column {column} has {len(out_of_range)} values outside range [{min_val}, {max_val}]"
                    )
        
        return errors

    def _check_unique_constraints(self, df: pd.DataFrame) -> List[str]:
        """
        Check uniqueness constraints
        """
        errors = []
        
        for column in self.config.unique_columns:
            if column in df.columns:
                duplicates = df[df[column].duplicated()].index
                if len(duplicates) > 0:
                    errors.append(f"Column {column} has {len(duplicates)} duplicate values")
        
        return errors

    def _check_missing_values(self, df: pd.DataFrame) -> List[str]:
        """
        Check missing values ratio
        """
        errors = []
        
        for column in df.columns:
            missing_ratio = df[column].isnull().mean()
            if missing_ratio > self.config.max_missing_ratio:
                errors.append(
                    f"Column {column} has {missing_ratio:.2%} missing values, "
                    f"exceeding threshold of {self.config.max_missing_ratio:.2%}"
                )
        
        return errors

    def _check_data_quality(self, df: pd.DataFrame) -> List[str]:
        """
        Additional data quality checks
        """
        errors = []
        
        # Check for constant columns
        constant_columns = [
            column for column in df.columns
            if df[column].nunique() == 1
        ]
        if constant_columns:
            errors.append(f"Constant columns detected: {', '.join(constant_columns)}")
        
        # Check for high cardinality in categorical columns
        categorical_columns = df.select_dtypes(include=['object']).columns
        for column in categorical_columns:
            cardinality_ratio = df[column].nunique() / len(df)
            if cardinality_ratio > 0.9:
                errors.append(
                    f"High cardinality detected in column {column}: "
                    f"{cardinality_ratio:.2%} unique values"
                )
        
        return errors

    @staticmethod
    def _is_compatible_type(actual_type: str, expected_type: str) -> bool:
        """
        Check if data types are compatible
        """
        type_mappings = {
            'int': ['int64', 'int32', 'int16', 'int8'],
            'float': ['float64', 'float32', 'float16'],
            'string': ['object', 'string'],
            'boolean': ['bool'],
            'datetime': ['datetime64[ns]', 'datetime64']
        }
        
        return str(actual_type) in type_mappings.get(expected_type.lower(), [expected_type])