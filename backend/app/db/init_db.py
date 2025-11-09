# app/db/init_db.py
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.base_class import Base
from app.db.session import engine
from app.db.session import SessionLocal
import logging

logger = logging.getLogger(__name__)

def init_db() -> None:
    """Initialize the database. Create all tables."""
    # Import all models here to ensure they are registered
    from app.models import User, Project, Dataset, MLModel, Training, Evaluation
    Base.metadata.create_all(bind=engine)

def create_default_user(db: Session) -> None:
    """Create a default user if no users exist."""
    from app.models.user import User
    from app.core.security import get_password_hash

    # Check if any users exist
    user_count = db.query(User).count()
    if user_count == 0:
        logger.info("No users found. Creating default admin user...")
        default_user = User(
            email="admin@example.com",
            full_name="Default Admin",
            hashed_password=get_password_hash("Admin@123"),
            is_active=True,
            is_superuser=True
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        logger.info(f"Default user created: {default_user.email} (password: Admin@123)")
        logger.warning("IMPORTANT: Change the default admin password immediately!")
        return default_user
    return None

def get_db():
    db = SessionLocal()  # Use the correct session here
    try:
        yield db
    finally:
        db.close()