# app/schemas/model.py
from typing import Optional, Dict, Any
from pydantic import BaseModel
from .base import TimestampMixin

class MLModelBase(BaseModel):  # Renamed from ModelBase
    name: str
    description: Optional[str] = None
    framework: str
    architecture: str
    version: str = "1.0.0"
    config: Dict[str, Any]
    hyperparameters: Optional[Dict[str, Any]] = None

class MLModelCreate(MLModelBase):  # Renamed from ModelCreate
    pass

class MLModelUpdate(MLModelBase):  # Renamed from ModelUpdate
    pass

class MLModel(MLModelBase, TimestampMixin):  # Renamed from Model
    id: int
    owner_id: int
    project_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    size: Optional[float] = None
    is_default: bool = False

    class Config:
        from_attributes = True