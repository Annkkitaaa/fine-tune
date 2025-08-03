from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create database engine (sync only for now to avoid async dependencies)
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)