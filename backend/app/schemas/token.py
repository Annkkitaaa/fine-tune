# app/schemas/token.py
from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str  # user_id
    exp: Optional[int] = None  # expiration time
    type: str = "access"  # token type
    jti: Optional[str] = None  # unique token identifier

class TokenData(BaseModel):
    username: Optional[str] = None