# app/schemas/model.py
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class MLModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    framework: str
    architecture: str
    version: str = "1.0.0"
    config: Optional[Dict[str, Any]] = {}
    hyperparameters: Optional[Dict[str, Any]] = {}

class MLModelCreate(MLModelBase):
    pass

class MLModelUpdate(MLModelBase):
    pass

class MLModel(MLModelBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = {}
    size: Optional[int] = None
    is_default: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True