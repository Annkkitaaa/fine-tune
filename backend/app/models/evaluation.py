from typing import Optional
from sqlalchemy import String, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

class Evaluation(Base):
    __tablename__ = "evaluations"  # Added tablename

    metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    parameters: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    predictions_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    confusion_matrix: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    feature_importance: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    execution_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Performance metrics
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Foreign Keys
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), nullable=False)  # Updated to match MLModel table
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"), nullable=False)
    training_id: Mapped[Optional[int]] = mapped_column(ForeignKey("trainings.id"), nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="evaluations")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="evaluations")
    model: Mapped["MLModel"] = relationship("MLModel", back_populates="evaluations")  # Updated to MLModel
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="evaluations")
    training: Mapped[Optional["Training"]] = relationship("Training", back_populates="evaluations")
