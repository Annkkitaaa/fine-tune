from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.security import get_password_hash, verify_password

class User(Base):
    """User model for authentication and user management"""
    
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    projects = relationship("Project", back_populates="owner")
    datasets = relationship("Dataset", back_populates="owner")
    models = relationship("Model", back_populates="owner")
    trainings = relationship("Training", back_populates="owner")
    evaluations = relationship("Evaluation", back_populates="owner")

    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)

    def set_password(self, password: str) -> None:
        self.hashed_password = get_password_hash(password)