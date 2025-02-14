# app/schemas/__init__.py
from .base import TimestampMixin
from .token import Token, TokenPayload, TokenData
from .user import User, UserCreate, UserUpdate
from .project import Project, ProjectCreate, ProjectUpdate
from .dataset import Dataset, DatasetCreate, DatasetUpdate
from .model import MLModel, MLModelCreate, MLModelUpdate  # Updated names
from .training import Training, TrainingCreate, TrainingUpdate, TrainingStatus
from .evaluation import Evaluation, EvaluationCreate, EvaluationUpdate
from .relationships import TrainingWithRelations, EvaluationWithRelations
from .deployment import Deployment, DeploymentCreate, DeploymentUpdate

__all__ = [
    "TimestampMixin",
    "Token", "TokenPayload", "TokenData",
    "User", "UserCreate", "UserUpdate",
    "Project", "ProjectCreate", "ProjectUpdate",
    "Dataset", "DatasetCreate", "DatasetUpdate",
    "MLModel", "MLModelCreate", "MLModelUpdate",  # Updated names
    "Training", "TrainingCreate", "TrainingUpdate", "TrainingStatus",
    "Evaluation", "EvaluationCreate", "EvaluationUpdate",
    "TrainingWithRelations", "EvaluationWithRelations","Deployment" , "DeploymentCreate", "DeploymentUpdate"
]