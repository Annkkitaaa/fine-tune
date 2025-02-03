# app/core/config.py
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Model Fine-Tuning Labs"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",")]
        return v or []

    # JWT Configuration
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database Configuration
    DATABASE_URL: str
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if v:
            return v
        return values.get("DATABASE_URL")

    # File Storage Configuration
    UPLOAD_FOLDER: str = "uploads"
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size

    # ML Model Configuration
    SUPPORTED_FRAMEWORKS: List[str] = ["pytorch", "tensorflow", "scikit-learn"]
    DEFAULT_BATCH_SIZE: int = 32
    MAX_EPOCHS: int = 100
    
    # Training Configuration
    MAX_CONCURRENT_TRAININGS: int = 5
    TRAINING_TIMEOUT: int = 3600  # 1 hour
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_file_encoding='utf-8'
    )