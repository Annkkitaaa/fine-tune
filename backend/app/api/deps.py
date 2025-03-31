# app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dev_config import BYPASS_AUTH, MOCK_USER
from app.db.session import SessionLocal
from app.models.user import User
from app.services.auth.jwt import decode_access_token
import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login", 
    auto_error=not BYPASS_AUTH  # Don't auto-error if auth is bypassed
)

def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_mock_dev_user(db: Session) -> User:
    """
    Get or create mock development user when auth is bypassed
    """
    # Check if mock user exists in DB
    user = db.query(User).filter(User.email == MOCK_USER["email"]).first()
    
    # If not, create one
    if user is None:
        logger.info("Creating mock development user")
        user = User(
            email=MOCK_USER["email"],
            full_name=MOCK_USER["full_name"],
            is_active=MOCK_USER["is_active"],
            is_superuser=MOCK_USER["is_superuser"],
            hashed_password="$2b$12$mock_hashed_password_for_development"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user"""
    # Development mode with auth bypass
    if BYPASS_AUTH:
        logger.info("Development mode: Authentication bypassed, using mock user")
        return get_mock_dev_user(db)
    
    # Normal authentication flow
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode token and get user_id from sub field
        payload = decode_access_token(token)
        user_id = payload.sub
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
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
    """Get current active superuser"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user