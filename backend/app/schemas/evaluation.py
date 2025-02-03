from typing import Optional, Dict, Any
from pydantic import BaseModel
from .base import TimestampMixin

class EvaluationBase(BaseModel):
    metrics: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = None

class EvaluationCreate(EvaluationBase):
    model_id: int
    dataset_id: int
    training_id: Optional[int] = None

class EvaluationUpdate(EvaluationBase):
    pass

class Evaluation(EvaluationBase, TimestampMixin):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    model_id: int
    dataset_id: int
    training_id: Optional[int] = None
    predictions_path: Optional[str] = None
    confusion_matrix: Optional[Dict[str, Any]] = None
    feature_importance: Optional[Dict[str, Any]] = None
    execution_time: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None

    class Config:
        from_attributes = True
