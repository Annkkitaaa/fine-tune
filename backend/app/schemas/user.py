from typing import Optional
from pydantic import BaseModel, EmailStr
from .base import TimestampMixin

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase, TimestampMixin):
    id: int
    is_superuser: bool

    class Config:
        from_attributes = True
