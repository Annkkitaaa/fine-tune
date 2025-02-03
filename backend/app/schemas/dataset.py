from typing import Optional, Dict, Any
from pydantic import BaseModel
from .base import TimestampMixin

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: str
    preprocessing_config: Optional[Dict[str, Any]] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase, TimestampMixin):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    file_path: str
    size: Optional[float] = None
    num_rows: Optional[int] = None
    num_features: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True