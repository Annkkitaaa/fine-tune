from typing import Optional, Dict, Any
from pydantic import BaseModel, validator
from datetime import datetime

class ModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    framework: str
    architecture: str
    version: str = "1.0.0"
    config: Dict[str, Any]
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelCreate(ModelBase):
    @validator('framework')
    def validate_framework(cls, v):
        allowed_frameworks = {'pytorch', 'tensorflow', 'scikit-learn'}
        if v not in allowed_frameworks:
            raise ValueError(f'Framework must be one of {allowed_frameworks}')
        return v

class ModelUpdate(ModelBase):
    pass

class Model(ModelBase):
    id: int
    owner_id: int
    project_id: Optional[int]
    metrics: Optional[Dict[str, Any]]
    size: Optional[float]
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True