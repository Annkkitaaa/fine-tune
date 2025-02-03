from typing import Optional, Dict, Any
from pydantic import BaseModel
from .base import TimestampMixin

class ModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    framework: str
    architecture: str
    version: str = "1.0.0"
    config: Dict[str, Any]
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelCreate(ModelBase):
    pass

class ModelUpdate(ModelBase):
    pass

class Model(ModelBase, TimestampMixin):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    size: Optional[float] = None
    is_default: bool = False

    class Config:
        from_attributes = True
