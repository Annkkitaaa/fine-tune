# app/models/user.py
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Boolean, String, Integer, DateTime, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base
from app.core.security import get_password_hash, verify_password

if TYPE_CHECKING:
    from .project import Project
    from .dataset import Dataset
    from .model import MLModel
    from .training import Training
    from .evaluation import Evaluation
    from .deployment import Deployment

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    models = relationship("MLModel", back_populates="owner", cascade="all, delete-orphan")
    trainings = relationship("Training", back_populates="owner", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="owner", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="owner", cascade="all, delete-orphan")

    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)

    def set_password(self, password: str) -> None:
        self.hashed_password = get_password_hash(password)

    def update_last_login(self) -> None:
        self.last_login = datetime.utcnow()

    def __repr__(self):
        return f"<User {self.email}>"

@event.listens_for(User, 'before_insert')
def user_before_insert(mapper, connection, target):
    if target.email:
        target.email = target.email.lower()

@event.listens_for(User, 'before_update')
def user_before_update(mapper, connection, target):
    if target.email:
        target.email = target.email.lower()