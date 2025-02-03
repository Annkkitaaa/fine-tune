# app/schemas/relations.py
from typing import Optional, List
from .training import Training
from .model import Model
from .dataset import Dataset

class TrainingWithRelations(Training):
    model: Optional[Model]
    dataset: Optional[Dataset]

    class Config:
        from_attributes = True