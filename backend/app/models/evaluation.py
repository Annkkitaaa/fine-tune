# app/models/evaluation.py
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
    from .training import Training

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    metrics = Column(JSON)
    parameters = Column(JSON)
    confusion_matrix = Column(JSON)
    feature_importance = Column(JSON)
    
    # Performance metrics
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    execution_time = Column(Float)
    
    # Foreign Keys
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    training_id = Column(Integer, ForeignKey("trainings.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="evaluations")
    model = relationship("MLModel", back_populates="evaluations")
    dataset = relationship("Dataset", back_populates="evaluations")  # ✅ Ensure bidirectional relationship
    project = relationship("Project", back_populates="evaluations")
    training = relationship("Training", back_populates="evaluations")
