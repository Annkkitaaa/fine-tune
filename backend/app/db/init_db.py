from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.base_class import Base
from app.db.session import engine, SessionLocal
from app.models.user import User

def init_db() -> None:
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()