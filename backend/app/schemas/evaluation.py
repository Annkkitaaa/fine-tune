# app/schemas/evaluation.py
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel
from .base import TimestampMixin

class ConfusionMatrix(BaseModel):
    matrix: List[List[int]]
    labels: List[str]  # Changed from List[int] to List[str]
    predictions: List[str]  # Changed from List[int] to List[str]

class MetricsConfig(BaseModel):
    accuracy: bool = False
    precision: bool = False
    recall: bool = False
    f1_score: bool = False
    mse: bool = False
    rmse: bool = False
    mae: bool = False
    r2: bool = False

class EvaluationParameters(BaseModel):
    test_split: float = 0.2
    random_seed: int = 42
    threshold: float = 0.5

class EvaluationBase(BaseModel):
    dataset_id: int
    metrics: MetricsConfig
    parameters: EvaluationParameters

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationUpdate(BaseModel):
    metrics: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class Evaluation(TimestampMixin):
    metrics: Dict[str, Any]
    parameters: Optional[Dict[str, Any]]
    id: int
    owner_id: int
    project_id: Optional[int] = None
    model_id: int
    dataset_id: int
    training_id: Optional[int] = None
    predictions_path: Optional[str] = None
    confusion_matrix: Optional[Dict[str, Union[List[List[int]], List[str]]]] = None
    feature_importance: Optional[Dict[str, float]] = None
    execution_time: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None

    class Config:
        from_attributes = True