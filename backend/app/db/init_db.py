import logging
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine
from app.core.config import settings

# Import all SQLAlchemy models here
from app.models.user import User
from app.models.dataset import Dataset
from app.models.model import Model
from app.models.training import Training
from app.models.evaluation import Evaluation
from app.models.deployment import Deployment

logger = logging.getLogger(__name__)

# Create all tables
def init_db(engine) -> None:
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize with default data if needed
        db = Session(engine)
        try:
            init_default_data(db)
            logger.info("Default data initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing default data: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def init_default_data(db: Session) -> None:
    """
    Initialize database with default data
    """
    try:
        # Check if we need to create default admin user
        if not db.query(User).filter(User.email == settings.FIRST_SUPERUSER).first():
            from app.core.security import get_password_hash
            
            user = User(
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_superuser=True,
                full_name="Default Admin"
            )
            db.add(user)
            
        # Add default ML model configurations
        init_model_configs(db)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise e

def init_model_configs(db: Session) -> None:
    """
    Initialize default ML model configurations
    """
    default_configs = {
        "pytorch": {
            "name": "PyTorch Default",
            "framework": "pytorch",
            "default_config": {
                "learning_rate": 0.001,
                "batch_size": 32,
                "epochs": 10,
                "optimizer": "adam"
            }
        },
        "tensorflow": {
            "name": "TensorFlow Default",
            "framework": "tensorflow",
            "default_config": {
                "learning_rate": 0.001,
                "batch_size": 32,
                "epochs": 10,
                "optimizer": "adam"
            }
        },
        "scikit-learn": {
            "name": "Scikit-learn Default",
            "framework": "scikit-learn",
            "default_config": {
                "random_state": 42
            }
        }
    }
    
    for config in default_configs.values():
        if not db.query(Model).filter(Model.name == config["name"]).first():
            model = Model(
                name=config["name"],
                framework=config["framework"],
                config=config["default_config"],
                is_default=True
            )
            db.add(model)

# Database utility functions
def get_db():
    """
    Get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connected() -> bool:
    """
    Check if database is connected
    """
    try:
        # Try to connect to the database
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

def reset_db() -> None:
    """
    Reset database (for testing purposes)
    """
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database reset successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise
