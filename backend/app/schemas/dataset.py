from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: str
    preprocessing_config: Optional[Dict[str, Any]] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    file_path: str
    size: Optional[float] = None
    num_rows: Optional[int] = None
    num_features: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
