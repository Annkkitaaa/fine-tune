# app/db/base.py
from app.db.base_class import Base  # noqa

# Import all models here
from app.models.user import User  # noqa
from app.models.project import Project  # noqa
from app.models.dataset import Dataset  # noqa
from app.models.model import Model  # noqa
from app.models.training import Training  # noqa
from app.models.evaluation import Evaluation  # noqa