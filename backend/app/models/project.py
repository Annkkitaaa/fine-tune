# app/models/project.py
from typing import Optional, List
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

class Project(Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="projects")
    datasets: Mapped[List["Dataset"]] = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    models: Mapped[List["Model"]] = relationship("Model", back_populates="project", cascade="all, delete-orphan")
    trainings: Mapped[List["Training"]] = relationship("Training", back_populates="project", cascade="all, delete-orphan")
    evaluations: Mapped[List["Evaluation"]] = relationship("Evaluation", back_populates="project", cascade="all, delete-orphan")