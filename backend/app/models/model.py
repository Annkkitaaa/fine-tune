from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Model(Base):
    """Model for managing ML models and their configurations"""
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    framework = Column(String, nullable=False)  # pytorch, tensorflow, sklearn
    architecture = Column(String, nullable=False)
    version = Column(String, nullable=False, default="1.0.0")
    config = Column(JSON, nullable=False)  # model architecture config
    hyperparameters = Column(JSON, nullable=True)  # training hyperparameters
    metrics = Column(JSON, nullable=True)  # latest evaluation metrics
    size = Column(Float, nullable=True)  # model size in MB
    is_default = Column(Boolean, default=False)
    
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="models")
    project = relationship("Project", back_populates="models")
    trainings = relationship("Training", back_populates="model")
    evaluations = relationship("Evaluation", back_populates="model")
