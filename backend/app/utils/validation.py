# validation.py
from typing import Dict, Any, List, Optional, Union, Tuple
import numpy as np
import pandas as pd
from pydantic import BaseModel, validator, ValidationError
import json
import re
from pathlib import Path
import logging
from datetime import datetime
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class DataValidator:
    """
    Validator for ML-related data inputs
    """
    
    @staticmethod
    def validate_dataset(
        data: Union[pd.DataFrame, np.ndarray, List],
        requirements: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Validate dataset against requirements
        """
        errors = []
        
        try:
            # Convert to DataFrame if necessary
            if isinstance(data, (np.ndarray, List)):
                data = pd.DataFrame(data)
            
            # Check required columns
            if 'required_columns' in requirements:
                missing_cols = set(requirements['required_columns']) - set(data.columns)
                if missing_cols:
                    errors.append(f"Missing required columns: {missing_cols}")
            
            # Check data types
            if 'column_types' in requirements:
                for col, expected_type in requirements['column_types'].items():
                    if col in data.columns:
                        if not DataValidator._check_column_type(data[col], expected_type):
                            errors.append(f"Column {col} has incorrect type. Expected {expected_type}")
            
            # Check value ranges
            if 'value_ranges' in requirements:
                for col, (min_val, max_val) in requirements['value_ranges'].items():
                    if col in data.columns:
                        if not data[col].between(min_val, max_val).all():
                            errors.append(f"Column {col} contains values outside range [{min_val}, {max_val}]")
            
            # Check missing values
            if 'max_missing_ratio' in requirements:
                for col in data.columns:
                    missing_ratio = data[col].isnull().mean()
                    if missing_ratio > requirements['max_missing_ratio']:
                        errors.append(f"Column {col} has too many missing values ({missing_ratio:.2%})")
            
            # Check unique constraints
            if 'unique_columns' in requirements:
                for col in requirements['unique_columns']:
                    if col in data.columns and not data[col].is_unique:
                        errors.append(f"Column {col} contains duplicate values")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Error validating dataset: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            return False, errors

    @staticmethod
    def _check_column_type(series: pd.Series, expected_type: str) -> bool:
        """
        Check if column data type matches expected type
        """
        type_mapping = {
            'numeric': (np.number, float, int),
            'integer': (np.integer, int),
            'float': (np.floating, float),
            'string': (str, object),
            'boolean': (bool, np.bool_),
            'datetime': (np.datetime64, pd.Timestamp)
        }
        
        if expected_type not in type_mapping:
            raise ValueError(f"Unsupported type: {expected_type}")
            
        return isinstance(series.dtype.type, type_mapping[expected_type])

class ModelConfigValidator:
    """
    Validator for model configurations
    """
    
    @staticmethod
    def validate_model_config(
        config: Dict[str, Any],
        model_type: str
    ) -> Tuple[bool, List[str]]:
        """
        Validate model configuration
        """
        errors = []
        
        try:
            if model_type == "pytorch":
                errors.extend(ModelConfigValidator._validate_pytorch_config(config))
            elif model_type == "tensorflow":
                errors.extend(ModelConfigValidator._validate_tensorflow_config(config))
            elif model_type == "sklearn":
                errors.extend(ModelConfigValidator._validate_sklearn_config(config))
            else:
                errors.append(f"Unsupported model type: {model_type}")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Error validating model config: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            return False, errors

    @staticmethod
    def _validate_pytorch_config(config: Dict[str, Any]) -> List[str]:
        """
        Validate PyTorch model configuration
        """
        errors = []
        
        required_fields = ['architecture', 'input_shape', 'optimizer']
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required field: {field}")
        
        if 'learning_rate' in config and not (0 < config['learning_rate'] < 1):
            errors.append("Learning rate must be between 0 and 1")
        
        if 'batch_size' in config and config['batch_size'] <= 0:
            errors.append("Batch size must be positive")
        
        return errors

    @staticmethod
    def _validate_tensorflow_config(config: Dict[str, Any]) -> List[str]:
        """
        Validate TensorFlow model configuration
        """
        errors = []
        
        required_fields = ['architecture', 'input_shape', 'optimizer']
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required field: {field}")
        
        if 'layers' in config and not isinstance(config['layers'], list):
            errors.append("Layers must be a list")
        
        return errors

    @staticmethod
    def _validate_sklearn_config(config: Dict[str, Any]) -> List[str]:
        """
        Validate scikit-learn model configuration
        """
        errors = []
        
        required_fields = ['model_type', 'parameters']
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required field: {field}")
        
        return errors

class TrainingConfigValidator:
    """
    Validator for training configurations
    """
    
    @staticmethod
    def validate_training_config(
        config: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Validate training configuration
        """
        errors = []
        
        try:
            # Validate basic training parameters
            required_fields = ['batch_size', 'epochs', 'optimizer']
            for field in required_fields:
                if field not in config:
                    errors.append(f"Missing required field: {field}")
            
            # Validate numeric parameters
            if 'batch_size' in config:
                if not isinstance(config['batch_size'], int) or config['batch_size'] <= 0:
                    errors.append("Batch size must be a positive integer")
            
            if 'epochs' in config:
                if not isinstance(config['epochs'], int) or config['epochs'] <= 0:
                    errors.append("Epochs must be a positive integer")
            
            if 'learning_rate' in config:
                if not isinstance(config['learning_rate'], (int, float)) or config['learning_rate'] <= 0:
                    errors.append("Learning rate must be a positive number")
            
            # Validate optimizer configuration
            if 'optimizer' in config:
                if not isinstance(config['optimizer'], dict):
                    errors.append("Optimizer configuration must be a dictionary")
                elif 'name' not in config['optimizer']:
                    errors.append("Optimizer must have a name")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Error validating training config: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            return False, errors

class FileValidator:
    """
    Validator for file operations
    """
    
    @staticmethod
    def validate_file(
        file_path: Union[str, Path],
        required_extension: Optional[str] = None,
        max_size_mb: Optional[int] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate file properties
        """
        errors = []
        file_path = Path(file_path)
        
        try:
            # Check if file exists
            if not file_path.exists():
                errors.append(f"File does not exist: {file_path}")
                return False, errors
            
            # Check file extension
            if required_extension:
                if not str(file_path).lower().endswith(required_extension.lower()):
                    errors.append(f"Invalid file extension. Expected: {required_extension}")
            
            # Check file size
            if max_size_mb:
                size_mb = file_path.stat().st_size / (1024 * 1024)  # Convert to MB
                if size_mb > max_size_mb:
                    errors.append(f"File size ({size_mb:.2f}MB) exceeds maximum allowed size ({max_size_mb}MB)")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            errors.append(f"Validation error: {str(e)}")
            return False, errors

def validate_request_data(data: Dict[str, Any], schema: BaseModel) -> Dict[str, Any]:
    """
    Validate request data against Pydantic schema
    """
    try:
        validated_data = schema(**data)
        return validated_data.dict()
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

def validate_file_upload(
    file: Any,
    allowed_extensions: List[str],
    max_size_mb: int
) -> None:
    """
    Validate file upload
    """
    try:
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        content = file.file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise HTTPException(
                status_code=400,
                detail=f"File size ({size_mb:.2f}MB) exceeds maximum allowed size ({max_size_mb}MB)"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating file upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error validating file upload"
        )