from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.core.config import settings

# Create async database engine
async_engine = create_async_engine(
    str(settings.DATABASE_URL).replace('postgresql://', 'postgresql+asyncpg://'),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    poolclass=AsyncAdaptedQueuePool,  # Changed to AsyncAdaptedQueuePool
    echo=False
)

# Create sync database engine
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False
)

# Create session factories
async_session = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)