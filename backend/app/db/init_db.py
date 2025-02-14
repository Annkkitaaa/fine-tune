# app/db/init_db.py
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.base_class import Base
from app.db.session import engine
from app.db.session import SessionLocal

def init_db() -> None:
    """Initialize the database. Create all tables."""
    # Import all models here to ensure they are registered
    from app.models import User, Project, Dataset, Model, Training, Evaluation
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()  # Use the correct session here
    try:
        yield db
    finally:
        db.close()