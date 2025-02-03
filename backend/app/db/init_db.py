# app/db/init_db.py
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base_class import Base  # noqa
from app.db.session import engine
from app.models.user import User  # noqa

def init_db(db: Session) -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)

def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()