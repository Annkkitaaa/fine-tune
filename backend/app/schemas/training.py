from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

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
    status: Optional[TrainingStatus]
    hyperparameters: Optional[Dict[str, Any]]

class Training(TrainingBase):
    id: int
    owner_id: int
    project_id: Optional[int]
    status: TrainingStatus
    start_time: Optional[str]
    end_time: Optional[str]
    duration: Optional[float]
    epochs_completed: Optional[int]
    training_logs: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    error_message: Optional[str]
    cpu_usage: Optional[float]
    memory_usage: Optional[float]
    gpu_usage: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TrainingWithRelations(Training):
    model: Model
    dataset: Dataset