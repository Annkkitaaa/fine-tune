# app/models/user.py
from typing import Optional, List
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.core.security import get_password_hash, verify_password

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    datasets: Mapped[List["Dataset"]] = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    models: Mapped[List["MLModel"]] = relationship("MLModel", back_populates="owner", cascade="all, delete-orphan")  # Updated to MLModel
    trainings: Mapped[List["Training"]] = relationship("Training", back_populates="owner", cascade="all, delete-orphan")
    evaluations: Mapped[List["Evaluation"]] = relationship("Evaluation", back_populates="owner", cascade="all, delete-orphan")

    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)

    def set_password(self, password: str) -> None:
        self.hashed_password = get_password_hash(password)