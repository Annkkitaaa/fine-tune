# app/models/training.py
from typing import Optional, List
from sqlalchemy import String, ForeignKey, JSON, Float, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base_class import Base

class TrainingStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class Training(Base):
    __tablename__ = "trainings"  # Added tablename

    status: Mapped[TrainingStatus] = mapped_column(Enum(TrainingStatus), nullable=False, default=TrainingStatus.QUEUED)
    start_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # in seconds
    epochs_completed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hyperparameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    training_logs: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Resource utilization
    cpu_usage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    memory_usage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gpu_usage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Foreign Keys
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), nullable=False)  # Updated to match MLModel table name
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"), nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="trainings")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="trainings")
    model: Mapped["MLModel"] = relationship("MLModel", back_populates="trainings")  # Updated to MLModel
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="trainings")
    evaluations: Mapped[List["Evaluation"]] = relationship("Evaluation", back_populates="training")