# app/core/security.py
from datetime import datetime, timedelta
from typing import Any, Union
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"  # This should match your login endpoint
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def is_valid_password(password: str) -> bool:
    """
    Validate password strength
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    - Contains at least one special character
    """
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    if not any(not c.isalnum() for c in password):
        return False
    return True