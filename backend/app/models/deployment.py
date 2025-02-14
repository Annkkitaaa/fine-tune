# app/models/deployment.py
from typing import TYPE_CHECKING, Optional, Dict, Any

from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .model import MLModel

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    
    # Foreign Keys
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Status and Configuration
    status = Column(String(50), nullable=False, default="pending")  # pending, deploying, active, failed, stopped
    config = Column(JSON)
    endpoint_url = Column(String(255))
    error_message = Column(String(1000))
    
    # Metrics and Monitoring
    metrics = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    
    # Relationships
    owner = relationship("User", back_populates="deployments")
    model = relationship("MLModel", back_populates="deployments")

    def __repr__(self):
        return f"<Deployment {self.name} (ID: {self.id})>"

    @property
    def is_active(self) -> bool:
        return self.status == "active"

    @property
    def duration(self) -> Optional[float]:
        """Calculate deployment duration in seconds"""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    def update_status(self, status: str, error_message: Optional[str] = None) -> None:
        """Update deployment status and related fields"""
        self.status = status
        self.updated_at = datetime.utcnow()
        
        if status == "active":
            if not self.start_time:
                self.start_time = datetime.utcnow()
        elif status in ["failed", "stopped"]:
            self.end_time = datetime.utcnow()
            if error_message:
                self.error_message = error_message

    def update_metrics(self, metrics: Dict[str, Any]) -> None:
        """Update deployment metrics"""
        if not self.metrics:
            self.metrics = {}
        self.metrics.update(metrics)
        self.updated_at = datetime.utcnow()