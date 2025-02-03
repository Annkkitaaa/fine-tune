from typing import Optional
from pydantic import BaseModel
from .model import Model
from .dataset import Dataset
from .training import Training
from .evaluation import Evaluation

class TrainingWithRelations(Training):
    model: Optional[Model] = None
    dataset: Optional[Dataset] = None

    class Config:
        from_attributes = True

class EvaluationWithRelations(Evaluation):
    model: Optional[Model] = None
    dataset: Optional[Dataset] = None
    training: Optional[Training] = None

    class Config:
        from_attributes = True