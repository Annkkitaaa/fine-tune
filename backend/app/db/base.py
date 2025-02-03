# app/db/base.py
from app.db.base_class import Base

# Import all models for SQLAlchemy to detect them
from app.models.user import User  # noqa