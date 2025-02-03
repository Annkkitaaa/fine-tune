from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class Project(Base):
    """Project model for organizing ML experiments"""
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    settings = Column(JSON, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project")
    models = relationship("Model", back_populates="project")
    trainings = relationship("Training", back_populates="project")
    evaluations = relationship("Evaluation", back_populates="project")