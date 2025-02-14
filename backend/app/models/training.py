# app/models/training.py
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
    status = Column(String, nullable=False)
    hyperparameters = Column(JSON)
    metrics = Column(JSON)
    
    # Resource Usage
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    gpu_usage = Column(Float)
    
    # Foreign Keys
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    
    # Error tracking
    error_message = Column(String)
    
    # Relationships
    owner = relationship("User", back_populates="trainings")
    model = relationship("MLModel", back_populates="trainings")
    dataset = relationship("Dataset", back_populates="trainings")
    project = relationship("Project", back_populates="trainings")
    evaluations = relationship("Evaluation", back_populates="training")