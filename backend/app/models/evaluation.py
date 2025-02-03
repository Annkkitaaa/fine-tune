from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Evaluation(Base):
    """Evaluation model for storing model evaluation results"""
    
    metrics = Column(JSON, nullable=False)  # evaluation metrics
    parameters = Column(JSON, nullable=True)  # evaluation parameters
    predictions_path = Column(String, nullable=True)  # path to predictions file
    confusion_matrix = Column(JSON, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    execution_time = Column(Float, nullable=True)  # in seconds
    
    model_id = Column(Integer, ForeignKey("model.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("dataset.id"), nullable=False)
    training_id = Column(Integer, ForeignKey("training.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True)
    
    # Detailed metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="evaluations")
    project = relationship("Project", back_populates="evaluations")
    model = relationship("Model", back_populates="evaluations")
    dataset = relationship("Dataset", back_populates="evaluations")
    training = relationship("Training", back_populates="evaluations")