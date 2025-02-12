from typing import AsyncGenerator, Optional, cast
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
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

# User dependencies
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get current authenticated user based on JWT token.
    Also performs token validation and user active status check.
    """
    try:
        # Decode and validate token
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise CREDENTIALS_EXCEPTION
        
        # Get token type and validate
        token_type: str = payload.get("type", "")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        # Get user from database
        user = await db.get(User, int(user_id))
        if user is None:
            raise CREDENTIALS_EXCEPTION

        # Check if user is active
        if not user.is_active:
            raise INACTIVE_USER_EXCEPTION

        # Update last activity
        user.last_login = datetime.utcnow()
        await db.commit()

        # Store user in request state for logging/tracking
        request.state.user = user
        
        return user

    except JWTError:
        raise CREDENTIALS_EXCEPTION

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current user and verify they are active.
    """
    if not current_user.is_active:
        raise INACTIVE_USER_EXCEPTION
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

# Permission checking dependencies
async def check_object_permission(
    db: AsyncSession,
    user: User,
    object_type: str,
    object_id: int
) -> bool:
    """
    Check if user has permission to access a specific object.
    """
    if user.is_superuser:
        return True

    model_map = {
        "project": "Project",
        "dataset": "Dataset",
        "model": "MLModel",
        "training": "Training",
        "evaluation": "Evaluation"
    }

    if object_type not in model_map:
        raise ValueError(f"Invalid object type: {object_type}")

    model_class = model_map[object_type]
    result = await db.execute(
        f"SELECT 1 FROM {model_class.lower()}s WHERE id = :id AND owner_id = :owner_id",
        {"id": object_id, "owner_id": user.id}
    )
    return result.scalar() is not None

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

async def validate_object_exists(
    db: AsyncSession,
    model_class: Any,
    object_id: int
) -> Any:
    """
    Validate that an object exists and return it.
    """
    obj = await db.get(model_class, object_id)
    if obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{model_class.__name__} not found"
        )
    return obj

# Cache dependency
async def get_cache():
    """
    Get cache connection for route handlers.
    """
    if not hasattr(get_cache, "client"):
        get_cache.client = await create_cache_client()
    return get_cache.client