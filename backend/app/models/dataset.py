# app/models/dataset.py
from typing import Optional, List
from sqlalchemy import String, ForeignKey, JSON, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

class Dataset(Base):
    __tablename__ = "datasets"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    format: Mapped[str] = mapped_column(String, nullable=False)
    size: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    num_rows: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    num_features: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    preprocessing_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)

    owner: Mapped["User"] = relationship("User", back_populates="datasets")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="datasets")
    trainings: Mapped[List["Training"]] = relationship("Training", back_populates="dataset")
    evaluations: Mapped[List["Evaluation"]] = relationship("Evaluation", back_populates="dataset")