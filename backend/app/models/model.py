from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .training import Training
    from .evaluation import Evaluation
    from .deployment import Deployment

class MLModel(Base):
    """ML Model with version control and metadata"""
    __tablename__ = "models"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    framework: Mapped[str] = mapped_column(String(50), nullable=False)
    architecture: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    
    # Configuration
    config: Mapped[Optional[dict]] = mapped_column(JSON)
    hyperparameters: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Foreign Keys
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Model Data
    file_path: Mapped[Optional[str]] = mapped_column(String(255))
    preprocessor_path: Mapped[Optional[str]] = mapped_column(String(255))
    size: Mapped[Optional[float]] = mapped_column(Integer)
    metrics: Mapped[Optional[dict]] = mapped_column(JSON)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),  # ✅ Ensure it's not NULL on creation
        onupdate=func.now(),
        nullable=False  # ✅ Prevent NULL values
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="models")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="models")
    trainings: Mapped[List["Training"]] = relationship(
        "Training",
        back_populates="model",
        cascade="all, delete-orphan"
    )
    evaluations: Mapped[List["Evaluation"]] = relationship(
        "Evaluation",
        back_populates="model",
        cascade="all, delete-orphan"
    )
    deployments: Mapped[List["Deployment"]] = relationship(
        "Deployment",
        back_populates="model",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<MLModel {self.name} ({self.framework}/{self.architecture})>"

    @property
    def full_version(self) -> str:
        """Get full version string including framework"""
        return f"{self.framework}-{self.version}"

    def update_metrics(self, metrics: dict) -> None:
        """Update model metrics"""
        if not self.metrics:
            self.metrics = {}
        self.metrics.update(metrics)
