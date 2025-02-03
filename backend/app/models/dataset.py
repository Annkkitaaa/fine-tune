from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Dataset(Base):
    """Dataset model for managing training and evaluation data"""
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    format = Column(String, nullable=False)  # csv, json, parquet, etc.
    size = Column(Float, nullable=True)  # in MB
    num_rows = Column(Integer, nullable=True)
    num_features = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)  # schema, feature types, etc.
    preprocessing_config = Column(JSON, nullable=True)
    
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="datasets")
    project = relationship("Project", back_populates="datasets")
    trainings = relationship("Training", back_populates="dataset")
    evaluations = relationship("Evaluation", back_populates="dataset")