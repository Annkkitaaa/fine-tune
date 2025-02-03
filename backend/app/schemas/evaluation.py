from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

class EvaluationBase(BaseModel):
    metrics: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = None

class EvaluationCreate(EvaluationBase):
    model_id: int
    dataset_id: int
    training_id: Optional[int]

class EvaluationUpdate(EvaluationBase):
    pass

class Evaluation(EvaluationBase):
    id: int
    owner_id: int
    project_id: Optional[int]
    model_id: int
    dataset_id: int
    training_id: Optional[int]
    predictions_path: Optional[str]
    confusion_matrix: Optional[Dict[str, Any]]
    feature_importance: Optional[Dict[str, Any]]
    execution_time: Optional[float]
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EvaluationWithRelations(Evaluation):
    model: Model
    dataset: Dataset
    training: Optional[Training]

# Common response models
class Message(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Any]