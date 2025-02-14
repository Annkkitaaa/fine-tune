# app/api/v1/users.py
from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_current_user, get_db
from app.core.security import get_password_hash
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """Get current user."""
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    password: str = Body(None),
    full_name: str = Body(None),
    email: str = Body(None),
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """Update own user."""
    current_user_data = jsonable_encoder(current_user)
    user_in = UserUpdate(**current_user_data)
    if password is not None:
        user_in.password = password
    if full_name is not None:
        user_in.full_name = full_name
    if email is not None:
        user_in.email = email

    user = current_user
    for field, value in user_in.dict(exclude_unset=True).items():
        if field == "password":
            hashed_password = get_password_hash(value)
            setattr(user, "hashed_password", hashed_password)
        else:
            setattr(user, field, value)
            
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get a specific user by id."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return user

@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """Retrieve users."""
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users