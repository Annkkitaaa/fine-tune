from typing import Optional, Dict, Any
from pydantic import BaseModel
from .base import TimestampMixin

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class Project(ProjectBase, TimestampMixin):
    id: int
    owner_id: int

    class Config:
        from_attributes = True