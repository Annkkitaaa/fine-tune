from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class TrainingStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class TrainingBase(BaseModel):
    hyperparameters: Optional[Dict[str, Any]] = None
    model_id: int
    dataset_id: int

class TrainingCreate(TrainingBase):
    pass

class TrainingUpdate(BaseModel):
    status: Optional[TrainingStatus] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    gpu_usage: Optional[float] = None

class Training(TrainingBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    status: TrainingStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    updated_at: datetime  # Ensuring `updated_at` is always returned
    created_at: datetime
    duration: Optional[float] = None  # Auto-calculated based on start & end times
    epochs_completed: Optional[int] = None
    training_logs: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    gpu_usage: Optional[float] = None

    class Config:
        from_attributes = True
