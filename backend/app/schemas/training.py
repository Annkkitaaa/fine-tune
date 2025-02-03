# app/schemas/training.py
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from .model import Model
from .dataset import Dataset

class TrainingStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class TrainingBase(BaseModel):
    hyperparameters: Dict[str, Any]
    model_id: int
    dataset_id: int

class TrainingCreate(TrainingBase):
    pass

class TrainingUpdate(BaseModel):
    status: Optional[TrainingStatus] = None
    hyperparameters: Optional[Dict[str, Any]] = None

class Training(TrainingBase):
    id: int
    owner_id: int
    project_id: Optional[int] = None
    status: TrainingStatus
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[float] = None
    epochs_completed: Optional[int] = None
    training_logs: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    gpu_usage: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TrainingWithRelations(Training):
    model: Model
    dataset: Dataset
