from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

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

class EvaluationCreate(BaseModel):
    dataset_id: int
    metrics: MetricsConfig
    parameters: EvaluationParameters

class EvaluationUpdate(BaseModel):
    metrics: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class Evaluation(BaseModel):
    id: int
    model_id: int
    dataset_id: int
    owner_id: int
    metrics: Dict[str, Any]
    parameters: Dict[str, Any]
    confusion_matrix: Optional[Dict[str, List[Any]]] = None
    feature_importance: Optional[Dict[str, float]] = None
    execution_time: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True