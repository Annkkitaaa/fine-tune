from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .dataset import Dataset
    from .model import MLModel
    from .evaluation import Evaluation

class Training(Base):
    __tablename__ = "trainings"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, nullable=False, default="queued")
    hyperparameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    
    # Resource Usage
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    gpu_usage = Column(Float, nullable=True)
    
    # Foreign Keys
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Error tracking
    error_message = Column(String, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="trainings")
    model = relationship("MLModel", back_populates="trainings")
    dataset = relationship("Dataset", back_populates="trainings")
    project = relationship("Project", back_populates="trainings")
    evaluations = relationship("Evaluation", back_populates="training")
