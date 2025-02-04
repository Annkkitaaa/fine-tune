# app/schemas/deployment.py
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class DeploymentBase(BaseModel):
    model_id: int
    name: str
    description: Optional[str] = None
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
    metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True