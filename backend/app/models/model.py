# app/models/model.py
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .training import Training
    from .evaluation import Evaluation
    from .deployment import Deployment

class MLModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    framework = Column(String, nullable=False)
    architecture = Column(String, nullable=False)
    version = Column(String, default="1.0.0")
    
    # Configuration and data
    config = Column(JSON, default={})
    hyperparameters = Column(JSON, default={})
    metrics = Column(JSON, default={})
    file_path = Column(String)
    preprocessor_path = Column(String)
    size = Column(Integer)
    is_default = Column(Boolean, default=False)
    
    # Foreign Keys
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="models")
    project = relationship("Project", back_populates="models")
    trainings = relationship("Training", back_populates="model", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="model", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="model", cascade="all, delete-orphan")