from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

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

class Model(ModelBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    size: Optional[float] = None
    is_default: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True