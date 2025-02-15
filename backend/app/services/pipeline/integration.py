# app/services/pipeline/integration.py
from typing import Dict, Any, Optional, Union, List
import pandas as pd
import numpy as np
import logging
from pathlib import Path
import json

from app.services.data.preprocessing import DataPreprocessor
from app.services.data.validation import DataValidator
from app.services.ml.evaluation.analysis import DataAnalysisService

logger = logging.getLogger(__name__)

class PipelineIntegrationService:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.preprocessor = DataPreprocessor(self.config.get('preprocessing_config', {}))
        self.validator = DataValidator(self.config.get('validation_config', {}))
        self.analyzer = DataAnalysisService(self.config.get('analysis_config', {}))
        self._pipeline_stats = {}

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
            file_path = str(data)
            if file_path.endswith('.csv'):
                return pd.read_csv(file_path)
            elif file_path.endswith('.parquet'):
                return pd.read_parquet(file_path)
            elif file_path.endswith(('.xls', '.xlsx')):
                return pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")

    async def process_dataset(
        self,
        data: Union[pd.DataFrame, np.ndarray, str, Path],
        pipeline_config: Dict[str, Any],
        save_intermediate: bool = False
    ) -> Dict[str, Any]:
        """Process dataset through the pipeline"""
        try:
            # Convert input to DataFrame
            df = self._ensure_dataframe(data)

            # Initial validation
            is_valid, validation_errors = await self.validator.validate_dataset(df)
            if validation_errors:
                logger.warning(f"Validation warnings: {validation_errors}")

            # Preprocessing
            if pipeline_config.get('preprocessing'):
                processed_data, preprocessing_stats = await self.preprocessor.process_pipeline(
                    df,
                    save_path=Path("processed_data.parquet") if save_intermediate else None
                )
                df = pd.DataFrame(processed_data)  # Convert back to DataFrame
                self._pipeline_stats['preprocessing'] = preprocessing_stats

            # Analysis
            if pipeline_config.get('analysis'):
                analysis_results = await self.analyzer.analyze_dataset(df)
                self._pipeline_stats['analysis'] = analysis_results

            # Final validation
            final_valid, final_validation_errors = await self.validator.validate_dataset(df)
            if final_validation_errors:
                logger.warning(f"Final validation warnings: {final_validation_errors}")

            return {
                'statistics': self._pipeline_stats,
                'validation_errors': validation_errors + final_validation_errors if validation_errors else final_validation_errors,
                'output_shape': df.shape
            }

        except Exception as e:
            logger.error(f"Error in pipeline: {str(e)}")
            raise