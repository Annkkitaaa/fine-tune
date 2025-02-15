# app/schemas/pipeline.py
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel

class PreprocessingConfig(BaseModel):
    handle_missing: bool = False
    missing_strategy: Optional[str] = "mean"
    handle_outliers: Optional[bool] = False
    outlier_method: Optional[str] = "zscore"
    outlier_threshold: Optional[float] = 3.0
    scaling: Optional[bool] = True
    feature_engineering: Optional[bool] = False

class AnalysisConfig(BaseModel):
    perform_correlation: Optional[bool] = True
    perform_feature_importance: Optional[bool] = False
    generate_visualizations: Optional[bool] = True

class AugmentationConfig(BaseModel):
    method: Optional[str] = None
    factor: Optional[float] = 0.5
    random_state: Optional[int] = 42

class PipelineConfig(BaseModel):
    preprocessing: Optional[PreprocessingConfig] = None
    analysis: Optional[AnalysisConfig] = None
    augmentation: Optional[AugmentationConfig] = None

class PipelineRequest(BaseModel):
    dataset_id: int
    config: PipelineConfig

class PipelineResponse(BaseModel):
    pipeline_id: str
    status: str
    dataset_id: int
    config: PipelineConfig
    results: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    execution_time: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class PipelineListResponse(BaseModel):
    pipeline_id: str
    status: str
    dataset_id: int
    created_at: datetime
    updated_at: datetime
    execution_time: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True