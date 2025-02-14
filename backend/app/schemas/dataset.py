# app/schemas/dataset.py
from datetime import datetime
from typing import Optional, Dict, Any
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

# Renamed from DatasetResponse to Dataset
class Dataset(DatasetBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    file_path: str
    size: Optional[int] = None
    num_rows: Optional[int] = None
    num_features: Optional[int] = None
    meta_info: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True