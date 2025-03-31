# app/api/v1/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_db
from app.core.config import settings
from app.core.dev_config import BYPASS_AUTH
from app.services.auth.jwt import create_access_token
from app.services.auth.security import get_password_hash, verify_password
from app.schemas.token import Token
from app.schemas.user import UserCreate, User
from app.crud.crud_user import user_crud

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login
    """
    # Development mode with auth bypass
    if BYPASS_AUTH:
        logger.info(f"Development mode: Authentication bypassed for login attempt with username: {form_data.username}")
        return {
            "access_token": "mock-development-token",
            "token_type": "bearer",
        }
    
    # Normal login flow
    user = user_crud.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=User)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register new user
    """
    # Development mode with auth bypass
    if BYPASS_AUTH:
        logger.info(f"Development mode: Authentication bypassed for registration with email: {user_in.email}")
        # Still check for existing user to match normal behavior
        user = user_crud.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists.",
            )
            
        # Create the user but log that we're in dev mode
        logger.info("Creating user in development mode with auth bypass")
        return user_crud.create(db, obj_in=user_in)
    
    # Normal registration flow
    user = user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
        
    return user_crud.create(db, obj_in=user_in)