from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Float, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class TrainingStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class Training(Base):
    """Training job model for managing model training processes"""
    
    status = Column(Enum(TrainingStatus), nullable=False, default=TrainingStatus.QUEUED)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    duration = Column(Float, nullable=True)  # in seconds
    epochs_completed = Column(Integer, nullable=True)
    hyperparameters = Column(JSON, nullable=False)
    training_logs = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)  # training metrics
    error_message = Column(String, nullable=True)
    
    model_id = Column(Integer, ForeignKey("model.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("dataset.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True)
    
    # Resource utilization
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    gpu_usage = Column(Float, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="trainings")
    project = relationship("Project", back_populates="trainings")
    model = relationship("Model", back_populates="trainings")
    dataset = relationship("Dataset", back_populates="trainings")
    evaluations = relationship("Evaluation", back_populates="training")