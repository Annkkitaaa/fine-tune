# app/schemas/relationships.py
from typing import Optional
from pydantic import BaseModel
from .model import MLModel  # Updated from Model to MLModel
from .dataset import Dataset
from .training import Training
from .evaluation import Evaluation

class TrainingWithRelations(Training):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    model: Optional[MLModel]  # Updated to MLModel
    dataset: Optional[Dataset]

class EvaluationWithRelations(Evaluation):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    model: Optional[MLModel]  # Updated to MLModel
    dataset: Optional[Dataset]
    training: Optional[Training]