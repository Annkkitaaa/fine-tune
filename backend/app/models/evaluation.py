# app/models/evaluation.py
from typing import TYPE_CHECKING, Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from datetime import datetime

from app.db.base_class import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    metrics: Mapped[Dict] = Column(JSON)
    parameters: Mapped[Dict] = Column(JSON)
    confusion_matrix: Mapped[Optional[Dict]] = Column(JSON)
    feature_importance: Mapped[Optional[Dict]] = Column(JSON)

    # Performance metrics
    accuracy: Mapped[Optional[float]] = Column(Float)
    precision: Mapped[Optional[float]] = Column(Float)
    recall: Mapped[Optional[float]] = Column(Float)
    f1_score: Mapped[Optional[float]] = Column(Float)
    execution_time: Mapped[Optional[float]] = Column(Float)

    # Foreign Keys
    model_id: Mapped[int] = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"))
    dataset_id: Mapped[int] = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    owner_id: Mapped[int] = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    training_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("trainings.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="evaluations")
    model = relationship("MLModel", back_populates="evaluations")
    dataset = relationship("Dataset", back_populates="evaluations")
    project = relationship("Project", back_populates="evaluations")
    training = relationship("Training", back_populates="evaluations")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure timestamps are set
        if not self.created_at:
            self.created_at = datetime.utcnow()
        if not self.updated_at:
            self.updated_at = datetime.utcnow()

    def update(self, **kwargs):
        """Update evaluation fields"""
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert evaluation to dictionary format"""
        return {
            'id': self.id,
            'model_id': self.model_id,
            'dataset_id': self.dataset_id,
            'owner_id': self.owner_id,
            'metrics': self.metrics,
            'parameters': self.parameters,
            'confusion_matrix': self.confusion_matrix,
            'feature_importance': self.feature_importance,
            'execution_time': self.execution_time,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }