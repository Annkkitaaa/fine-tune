# app/db/base.py
from app.db.base_class import Base

# Import all models for SQLAlchemy to detect them
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.models.model import MLModel  # Note the MLModel import
from app.models.training import Training
from app.models.evaluation import Evaluation
from app.models.deployment import Deployment

# This allows all models to be registered with SQLAlchemy
__all__ = [
    "Base",
    "User",
    "Project",
    "Dataset",
    "MLModel",
    "Training",
    "Evaluation",
    "Deployment"
]