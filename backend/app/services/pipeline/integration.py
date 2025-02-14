from typing import Dict, Any, Optional, Union, List
import pandas as pd
import numpy as np
import logging
from pathlib import Path
import asyncio
from datetime import datetime
import json
import os
from concurrent.futures import ThreadPoolExecutor

from app.services.data.preprocessing import DataPreprocessor
from app.services.data.augmentation import DataAugmenter
from app.services.data.validation import DataValidator
from app.services.ml.evaluation.analysis import DataAnalysisService
from app.core.config import settings

logger = logging.getLogger(__name__)

class PipelineIntegrationService:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.preprocessor = EnhancedPreprocessor(config.get('preprocessing_config'))
        self.augmenter = DataAugmentationService(config.get('augmentation_config'))
        self.validator = DataValidator(config.get('validation_config'))
        self.analyzer = DataAnalysisService(config.get('analysis_config'))
        
        self._pipeline_stats = {}
        self._current_pipeline_id = None
        
        # Initialize storage paths
        self.base_path = Path(config.get('storage_path', 'pipeline_data'))
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def process_dataset(
        self,
        data: Union[pd.DataFrame, np.ndarray, str, Path],
        pipeline_config: Dict[str, Any],
        feature_names: Optional[List[str]] = None,
        save_intermediate: bool = False
    ) -> Dict[str, Any]:
        """
        Process dataset through the complete pipeline
        """
        try:
            # Generate pipeline ID and setup
            pipeline_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            self._current_pipeline_id = pipeline_id
            
            # Initialize pipeline statistics
            self._pipeline_stats[pipeline_id] = {
                'start_time': datetime.now().isoformat(),
                'stages': {},
                'errors': [],
                'warnings': [],
                'metadata': {
                    'config': pipeline_config,
                    'feature_names': feature_names
                }
            }
            
            # Load data if path provided
            if isinstance(data, (str, Path)):
                data = await self._load_dataset(data)
            
            # Stage 1: Initial Validation
            try:
                validation_results = await self.validator.validate_dataset(data)
                if not validation_results[0]:
                    self._pipeline_stats[pipeline_id]['warnings'].extend(validation_results[1])
            except Exception as e:
                self._handle_error(f"Initial validation error: {str(e)}", pipeline_id)
            
            # Stage 2: Preprocessing
            if pipeline_config.get('perform_preprocessing', True):
                try:
                    data, preprocessing_stats = await self.preprocessor.process_pipeline(
                        data,
                        feature_names=feature_names,
                        save_path=self._get_intermediate_path(pipeline_id, 'preprocessed') if save_intermediate else None
                    )
                    self._pipeline_stats[pipeline_id]['stages']['preprocessing'] = preprocessing_stats
                    
                    if save_intermediate:
                        await self._save_stage_data(data, pipeline_id, 'preprocessing')
                        
                except Exception as e:
                    self._handle_error(f"Preprocessing error: {str(e)}", pipeline_id)
            
            # Stage 3: Data Analysis
            if pipeline_config.get('perform_analysis', True):
                try:
                    analysis_results = await self.analyzer.analyze_dataset(
                        data,
                        feature_names=feature_names,
                        target_column=pipeline_config.get('target_column')
                    )
                    self._pipeline_stats[pipeline_id]['stages']['analysis'] = analysis_results
                    
                    # Save analysis visualizations if requested
                    if save_intermediate:
                        await self._save_analysis_results(analysis_results, pipeline_id)
                        
                except Exception as e:
                    self._handle_error(f"Analysis error: {str(e)}", pipeline_id)
            
            # Stage 4: Data Augmentation
            if pipeline_config.get('perform_augmentation'):
                try:
                    augmentation_config = pipeline_config.get('augmentation_config', {})
                    data, augmentation_stats = await self.augmenter.augment_dataset(
                        data,
                        method=augmentation_config.get('method', 'smote'),
                        augmentation_factor=augmentation_config.get('factor', 0.5),
                        feature_names=feature_names,
                        target_column=pipeline_config.get('target_column')
                    )
                    self._pipeline_stats[pipeline_id]['stages']['augmentation'] = augmentation_stats
                    
                    if save_intermediate:
                        await self._save_stage_data(data, pipeline_id, 'augmentation')
                        
                except Exception as e:
                    self._handle_error(f"Augmentation error: {str(e)}", pipeline_id)
            
            # Stage 5: Final Validation
            try:
                final_validation = await self.validator.validate_dataset(data)
                if not final_validation[0]:
                    self._pipeline_stats[pipeline_id]['warnings'].extend(final_validation[1])
            except Exception as e:
                self._handle_error(f"Final validation error: {str(e)}", pipeline_id)
            
            # Save final results
            if save_intermediate:
                await self._save_processed_data(
                    data,
                    self._get_intermediate_path(pipeline_id, 'final'),
                    pipeline_id
                )
            
            # Update pipeline completion statistics
            self._pipeline_stats[pipeline_id]['end_time'] = datetime.now().isoformat()
            self._pipeline_stats[pipeline_id]['duration'] = (
                datetime.fromisoformat(self._pipeline_stats[pipeline_id]['end_time']) -
                datetime.fromisoformat(self._pipeline_stats[pipeline_id]['start_time'])
            ).total_seconds()
            
            # Save pipeline statistics
            await self._save_pipeline_stats(pipeline_id)
            
            return {
                'pipeline_id': pipeline_id,
                'statistics': self._pipeline_stats[pipeline_id],
                'processed_data': data
            }
            
        except Exception as e:
            self._handle_error(f"Pipeline error: {str(e)}", pipeline_id)
            raise
    
    def _handle_error(self, error_msg: str, pipeline_id: str):
        """Handle and log pipeline errors"""
        logger.error(error_msg)
        if pipeline_id in self._pipeline_stats:
            self._pipeline_stats[pipeline_id]['errors'].append(error_msg)
    
    async def _load_dataset(self, path: Union[str, Path]) -> pd.DataFrame:
        """Load dataset from file"""
        path = Path(path)
        try:
            if path.suffix == '.csv':
                return pd.read_csv(path)
            elif path.suffix == '.parquet':
                return pd.read_parquet(path)
            elif path.suffix in ['.xls', '.xlsx']:
                return pd.read_excel(path)
            else:
                raise ValueError(f"Unsupported file format: {path.suffix}")
        except Exception as e:
            raise ValueError(f"Error loading dataset: {str(e)}")
    
    def _get_intermediate_path(self, pipeline_id: str, stage: str) -> Path:
        """Get path for intermediate results"""
        return self.base_path / pipeline_id / stage
    
    async def _save_stage_data(
        self,
        data: pd.DataFrame,
        pipeline_id: str,
        stage: str
    ):
        """Save intermediate stage data"""
        save_path = self._get_intermediate_path(pipeline_id, stage)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save data
        data.to_parquet(save_path / 'data.parquet')
        
        # Save metadata
        metadata = {
            'shape': data.shape,
            'columns': list(data.columns),
            'dtypes': data.dtypes.astype(str).to_dict(),
            'timestamp': datetime.now().isoformat()
        }
        
        with open(save_path / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=4)
    
    async def _save_analysis_results(
        self,
        results: Dict[str, Any],
        pipeline_id: str
    ):
        """Save analysis results and visualizations"""
        analysis_path = self._get_intermediate_path(pipeline_id, 'analysis')
        analysis_path.mkdir(parents=True, exist_ok=True)
        
        # Save analysis results
        with open(analysis_path / 'analysis_results.json', 'w') as f:
            json.dump(results, f, indent=4)
    
    async def _save_pipeline_stats(self, pipeline_id: str):
        """Save pipeline statistics"""
        stats_path = self.base_path / pipeline_id / 'pipeline_stats.json'
        stats_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(stats_path, 'w') as f:
            json.dump(self._pipeline_stats[pipeline_id], f, indent=4)
    
    def get_pipeline_stats(self, pipeline_id: Optional[str] = None) -> Dict[str, Any]:
        """Get pipeline statistics"""
        if pipeline_id:
            return self._pipeline_stats.get(pipeline_id)
        return self._pipeline_stats
    
    async def clean_old_pipelines(self, max_age_days: int = 7):
        """Clean up old pipeline data"""
        try:
            current_time = datetime.now()
            for pipeline_id in list(self._pipeline_stats.keys()):
                start_time = datetime.fromisoformat(
                    self._pipeline_stats[pipeline_id]['start_time']
                )
                if (current_time - start_time).days > max_age_days:
                    # Remove pipeline data
                    pipeline_path = self.base_path / pipeline_id
                    if pipeline_path.exists():
                        import shutil
                        shutil.rmtree(pipeline_path)
                    
                    # Remove pipeline stats
                    del self._pipeline_stats[pipeline_id]
                    
        except Exception as e:
            logger.error(f"Error cleaning old pipelines: {str(e)}")