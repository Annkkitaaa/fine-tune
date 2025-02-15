# app/models/dataset.py
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .training import Training
    from .evaluation import Evaluation  # ✅ Added missing import

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    format = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    size = Column(Integer)
    num_rows = Column(Integer)
    num_features = Column(Integer)
    preprocessing_config = Column(JSON)
    meta_info = Column(JSON)
    
    # Foreign Keys
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="datasets")
    project = relationship("Project", back_populates="datasets")
    trainings = relationship("Training", back_populates="dataset")
    pipelines = relationship("Pipeline", back_populates="dataset", cascade="all, delete-orphan")
    # ✅ Added missing relationship
    evaluations = relationship("Evaluation", back_populates="dataset", cascade="all, delete-orphan")
