from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import HTTPException, status
import uuid
from pydantic import BaseModel
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class TokenPayload(BaseModel):
    sub: str
    exp: int
    jti: str  # JWT ID for token tracking
    type: str  # Token type (access or refresh)
    iat: int  # Issued at
    fresh: bool  # Whether this is a fresh login token

class JWTHandler:
    """JWT token handler with enhanced security features"""
    
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    REFRESH_TOKEN_EXPIRE_DAYS = 30
    
    # Token blacklist (in production, use Redis/database)
    _token_blacklist = set()
    
    @classmethod
    def create_access_token(
        cls,
        subject: Union[str, Any],
        fresh: bool = False,
        expires_delta: Optional[timedelta] = None,
        scopes: Optional[list] = None,
    ) -> str:
        """Create JWT access token"""
        try:
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(
                    minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES
                )

            to_encode = {
                "sub": str(subject),
                "exp": expire,
                "type": "access",
                "jti": str(uuid.uuid4()),
                "iat": datetime.utcnow(),
                "fresh": fresh
            }
            
            if scopes:
                to_encode["scopes"] = scopes

            encoded_jwt = jwt.encode(
                to_encode,
                settings.SECRET_KEY,
                algorithm=cls.ALGORITHM
            )
            
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"Error creating access token: {str(e)}")
            raise

    @classmethod
    def verify_token(cls, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode JWT token
        
        Returns:
            Dict containing token claims if valid, None otherwise
        """
        try:
            # Check if token is blacklisted
            if cls.is_token_blacklisted(token):
                return None
            
            # Decode and verify token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            
            # Verify expiration
            if datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
                return None
                
            return payload
            
        except JWTError:
            return None
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None

    @classmethod
    def decode_token(cls, token: str) -> TokenPayload:
        """
        Decode and validate JWT token
        
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Check if token is blacklisted
            if cls.is_token_blacklisted(token):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            
            token_data = TokenPayload(**payload)
            
            # Validate token hasn't expired
            if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
            
            return token_data
            
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials"
            )
        except Exception as e:
            logger.error(f"Error decoding token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials"
            )

    @classmethod
    def is_token_blacklisted(cls, token: str) -> bool:
        """Check if a token has been revoked"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            return payload.get("jti") in cls._token_blacklist
        except:
            return False

    @classmethod
    def revoke_token(cls, token: str) -> None:
        """
        Revoke a token by adding it to blacklist
        """
        try:
            payload = cls.decode_token(token)
            cls._token_blacklist.add(payload.jti)
        except Exception as e:
            logger.error(f"Error revoking token: {str(e)}")
            raise

# Convenience functions
def create_access_token(*args, **kwargs) -> str:
    """Convenience function for creating access token"""
    return JWTHandler.create_access_token(*args, **kwargs)

def decode_access_token(token: str) -> TokenPayload:
    """Convenience function for decoding token"""
    return JWTHandler.decode_token(token)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Convenience function for verifying token"""
    return JWTHandler.verify_token(token)