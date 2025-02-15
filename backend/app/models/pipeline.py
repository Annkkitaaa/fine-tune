# app/models/pipeline.py
from typing import TYPE_CHECKING, Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from datetime import datetime
import pytz
import json

from app.db.base_class import Base
from app.utils.serialization import convert_numpy_types, NumpyJSONEncoder

if TYPE_CHECKING:
    from .user import User
    from .dataset import Dataset

class Pipeline(Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    pipeline_id: Mapped[str] = Column(String, unique=True, nullable=False)  # UUID
    status: Mapped[str] = Column(String, nullable=False)  # pending, running, completed, failed
    config: Mapped[Dict] = Column(JSON, nullable=False)
    results: Mapped[Optional[Dict]] = Column(JSON)
    error_message: Mapped[Optional[str]] = Column(String)

    # Foreign Keys
    owner_id: Mapped[int] = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id: Mapped[int] = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)

    # Timestamps with timezone
    created_at: Mapped[datetime] = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    start_time: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    end_time: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))

    # Execution metrics
    execution_time: Mapped[Optional[int]] = Column(Integer)  # in seconds
    memory_usage: Mapped[Optional[int]] = Column(Integer)  # in MB

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="pipelines")
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="pipelines")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Initialize timestamps with timezone-aware values
        if not self.created_at:
            self.created_at = datetime.now(pytz.UTC)
        if not self.updated_at:
            self.updated_at = datetime.now(pytz.UTC)

    def get_utc_now(self) -> datetime:
        """Get current UTC time with timezone"""
        return datetime.now(pytz.UTC)

    def update_status(self, status: str, error_message: Optional[str] = None) -> None:
        """Update pipeline status and related fields"""
        self.status = status
        self.updated_at = self.get_utc_now()
        
        if error_message:
            self.error_message = error_message

        current_time = self.get_utc_now()
        
        if status == "running":
            self.start_time = current_time
        elif status in ["completed", "failed"]:
            self.end_time = current_time
            if self.start_time:
                # Both times are timezone-aware, safe to subtract
                delta = self.end_time - self.start_time
                self.execution_time = int(delta.total_seconds())

    @property
    def results_json(self) -> Optional[Dict[str, Any]]:
        """Get results as JSON with numpy types converted"""
        if self.results:
            if isinstance(self.results, str):
                return json.loads(self.results)
            return convert_numpy_types(self.results)
        return None

    @results_json.setter
    def results_json(self, value: Dict[str, Any]) -> None:
        """Set results with numpy type conversion"""
        if value is not None:
            converted_value = convert_numpy_types(value)
            # Store as a dictionary instead of JSON string
            self.results = converted_value
            self.updated_at = self.get_utc_now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert pipeline to dictionary format"""
        return {
            'pipeline_id': self.pipeline_id,
            'status': self.status,
            'dataset_id': self.dataset_id,
            'config': self.config,
            'results': self.results_json,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'execution_time': self.execution_time,
            'error_message': self.error_message
        }