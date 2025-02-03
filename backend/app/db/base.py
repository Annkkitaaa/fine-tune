# app/db/base.py
from app.models.base import Base as BaseModel
from app.models.user import User

# Import all models here that should be included in 'create_all'
Base = BaseModel