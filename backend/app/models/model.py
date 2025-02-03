# app/models/model.py
from typing import Optional, List
from sqlalchemy import String, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

class MLModel(Base):  # Renamed from Model to MLModel to avoid confusion
    __tablename__ = "ml_models"  # Added tablename

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    framework: Mapped[str] = mapped_column(String, nullable=False)  # pytorch, tensorflow, etc.
    architecture: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False, default="1.0.0")
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    hyperparameters: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    size: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # in MB
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Foreign Keys
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="models")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="models")
    trainings: Mapped[List["Training"]] = relationship("Training", back_populates="model")
    evaluations: Mapped[List["Evaluation"]] = relationship("Evaluation", back_populates="model")