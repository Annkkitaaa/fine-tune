from typing import Optional, Dict, Any
from pydantic import BaseModel, validator
from datetime import datetime

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: str
    preprocessing_config: Optional[Dict[str, Any]] = None

class DatasetCreate(DatasetBase):
    @validator('format')
    def validate_format(cls, v):
        allowed_formats = {'csv', 'json', 'parquet', 'xlsx'}
        if v not in allowed_formats:
            raise ValueError(f'Format must be one of {allowed_formats}')
        return v

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    owner_id: int
    project_id: Optional[int]
    file_path: str
    size: Optional[float]
    num_rows: Optional[int]
    num_features: Optional[int]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True