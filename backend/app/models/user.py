# app/models/user.py
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Boolean, String, Integer, DateTime, event
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
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
    """
    User model with enhanced security and tracking features
    """
    __tablename__ = "users"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Authentication Fields
    email: Mapped[str] = mapped_column(
        String(length=255), 
        unique=True, 
        index=True, 
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(length=255), 
        nullable=False
    )
    
    # Profile Fields
    full_name: Mapped[Optional[str]] = mapped_column(
        String(length=255), 
        nullable=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(length=255), 
        nullable=True
    )

    # Status Fields
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False
    )

    # Tracking Fields
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )

    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    datasets: Mapped[List["Dataset"]] = relationship(
        "Dataset", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    models: Mapped[List["MLModel"]] = relationship(
        "MLModel", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    trainings: Mapped[List["Training"]] = relationship(
        "Training", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    evaluations: Mapped[List["Evaluation"]] = relationship(
        "Evaluation", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    deployments: Mapped[List["Deployment"]] = relationship(
        "Deployment",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    # Properties
    @hybrid_property
    def password_age_days(self) -> Optional[int]:
        """Calculate how old the current password is in days"""
        if self.password_changed_at:
            return (datetime.utcnow() - self.password_changed_at).days
        return None

    @hybrid_property
    def full_name_display(self) -> str:
        """Return full name if available, otherwise email"""
        return self.full_name or self.email.split('@')[0]

    # Methods
    def verify_password(self, plain_password: str) -> bool:
        """Verify a plain password against hashed password"""
        return verify_password(plain_password, self.hashed_password)

    def set_password(self, password: str) -> None:
        """Set a new password and update the change timestamp"""
        self.hashed_password = get_password_hash(password)
        self.password_changed_at = datetime.utcnow()

    def update_last_login(self) -> None:
        """Update the last login timestamp"""
        self.last_login = datetime.utcnow()

    def __repr__(self) -> str:
        """String representation of the user"""
        return f"<User {self.email}>"

# SQLAlchemy event listeners
@event.listens_for(User, 'before_insert')
def user_before_insert(mapper, connection, target):
    """Ensure email is lowercase before insert"""
    if target.email:
        target.email = target.email.lower()

@event.listens_for(User, 'before_update')
def user_before_update(mapper, connection, target):
    """Ensure email is lowercase before update"""
    if target.email:
        target.email = target.email.lower()