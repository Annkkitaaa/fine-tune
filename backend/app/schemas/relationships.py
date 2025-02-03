# app/schemas/relationships.py
from typing import Optional
from pydantic import BaseModel
from .model import MLModel  # Updated from Model to MLModel
from .dataset import Dataset
from .training import Training
from .evaluation import Evaluation

class TrainingWithRelations(Training):
    model: Optional[MLModel]  # Updated to MLModel
    dataset: Optional[Dataset]

    class Config:
        from_attributes = True

class EvaluationWithRelations(Evaluation):
    model: Optional[MLModel]  # Updated to MLModel
    dataset: Optional[Dataset]
    training: Optional[Training]

    class Config:
        from_attributes = True