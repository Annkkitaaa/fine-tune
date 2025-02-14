# app/api/deps.py
from typing import AsyncGenerator, Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.db.session import async_session, SessionLocal
from app.models.user import User
from app.services.auth.jwt import decode_access_token
from app.core.security import oauth2_scheme

# Constants
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

INACTIVE_USER_EXCEPTION = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Inactive user",
)

# Async database dependency
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async database session dependency.
    Use this for async route handlers.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Sync database dependency (for backwards compatibility)
def get_db() -> Generator[Session, None, None]:
    """
    Synchronous database session dependency.
    Use this only for sync route handlers.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current user and verify they are an active superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

# Rate limiting dependency
async def check_rate_limit(request: Request):
    """
    Check rate limiting for the current request.
    Requires rate limiting middleware to be setup.
    """
    if hasattr(request.app.state, "limiter"):
        await request.app.state.limiter.check(request)

# Request tracking dependency
async def track_request(request: Request):
    """
    Track request metrics and logging.
    """
    request.state.start_time = datetime.utcnow()
    
    # Add request ID if not present
    if not request.headers.get("X-Request-ID"):
        request.state.request_id = str(uuid.uuid4())

# Custom dependencies for specific features
async def get_pagination_params(
    page: int = 1,
    page_size: int = 10,
    max_page_size: int = 100
) -> tuple[int, int]:
    """
    Get and validate pagination parameters.
    """
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page number must be greater than 0"
        )
    
    if page_size < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be greater than 0"
        )
    
    if page_size > max_page_size:
        page_size = max_page_size
    
    return page, page_size