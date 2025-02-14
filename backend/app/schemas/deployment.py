# app/schemas/deployment.py
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class DeploymentBase(BaseModel):
    name: str
    description: Optional[str] = None
    model_id: int
    config: Optional[Dict[str, Any]] = None
    endpoint_url: Optional[str] = None

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    endpoint_url: Optional[str] = None

class Deployment(DeploymentBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True