# app/core/config.py
from typing import Any, Dict, List, Optional, Union, ClassVar
from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from typing_extensions import TypedDict

class TimezoneConfig(TypedDict):
    default_timezone: str
    store_timezone: bool
    convert_timezone: bool

class Settings(BaseSettings):
    # Basic Configuration
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
    
    # File Storage Configuration
    UPLOAD_FOLDER: str = os.path.join(os.getcwd(), "uploads")
    MODEL_STORAGE_PATH: str = os.path.join(os.getcwd(), "models")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS: List[str] = [".csv", ".json", ".parquet", ".xlsx"]

    # Pipeline Configuration
    PIPELINE_CONFIG: ClassVar[Dict[str, Dict[str, Any]]] = {
        'preprocessing_config': {
            'handle_missing': True,
            'missing_strategy': 'mean',
            'handle_outliers': True,
            'outlier_method': 'zscore',
            'outlier_threshold': 3,
            'scaling': True,
            'feature_engineering': False
        },
        'augmentation_config': {
            'method': 'smote',
            'factor': 0.5
        },
        'analysis_config': {
            'perform_correlation_analysis': True,
            'perform_distribution_analysis': True
        }
    }

    # Timezone Configuration
    TIMEZONE_CONFIG: ClassVar[TimezoneConfig] = {
        'default_timezone': 'UTC',
        'store_timezone': True,
        'convert_timezone': True
    }
    
    # ML Model Configuration
    SUPPORTED_FRAMEWORKS: List[str] = ["pytorch", "tensorflow", "scikit-learn"]
    DEFAULT_BATCH_SIZE: int = 32
    MAX_EPOCHS: int = 100
    
    # Training Configuration
    MAX_CONCURRENT_TRAININGS: int = 5
    TRAINING_TIMEOUT: int = 3600  # 1 hour
    MIN_TRAINING_SAMPLES: int = 100
    MAX_TRAINING_SAMPLES: int = 1000000
    DEFAULT_VALIDATION_SPLIT: float = 0.2
    
    # Model Storage Configuration
    MODEL_VERSIONS_TO_KEEP: int = 3
    ENABLE_MODEL_VERSIONING: bool = True
    MODEL_BACKUP_PATH: str = os.path.join(os.getcwd(), "model_backups")
    
    # TensorFlow Configuration
    TF_CPP_MIN_LOG_LEVEL: str = "2"  # Reduce TF logging
    TF_FORCE_GPU_ALLOW_GROWTH: str = "true"
    CUDA_VISIBLE_DEVICES: str = "-1"  # Disable GPU
    TF_NUM_INTEROP_THREADS: int = 1
    TF_NUM_INTRAOP_THREADS: int = 1
    MALLOC_ARENA_MAX: int = 2
    
    # PyTorch Configuration
    TORCH_NUM_THREADS: int = 1
    PYTORCH_CUDA_ALLOC_CONF: str = "max_split_size_mb:512"
    
    # Monitoring Configuration
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    METRICS_HOST: str = "localhost"
    LOG_LEVEL: str = "INFO"

    # Deployment Configuration
    DEPLOYMENT_HOST: str = "0.0.0.0"
    DEPLOYMENT_PORT: int = 8000
    MAX_DEPLOYMENTS: int = 5
    DEPLOYMENT_TIMEOUT: int = 300
    
    # Cache Configuration
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    
    # Security Configuration
    ALLOWED_HOSTS: List[str] = ["*"]
    SSL_KEYFILE: Optional[str] = None
    SSL_CERTFILE: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_url(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if isinstance(v, str):
            return v
        return "sqlite:///./test.db"  # Default SQLite database
    
    def get_model_path(self, model_id: int, version: str = "latest") -> str:
        """Get the path for storing a model"""
        base_path = os.path.join(self.MODEL_STORAGE_PATH, str(model_id))
        if version == "latest":
            return base_path
        return os.path.join(base_path, version)
    
    def get_upload_path(self, user_id: int) -> str:
        """Get the upload path for a specific user"""
        return os.path.join(self.UPLOAD_FOLDER, str(user_id))
    
    def create_required_directories(self):
        """Create all required directories"""
        os.makedirs(self.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(self.MODEL_STORAGE_PATH, exist_ok=True)
        os.makedirs(self.MODEL_BACKUP_PATH, exist_ok=True)
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_file_encoding='utf-8',
        extra='allow'
    )

# Create settings instance
settings = Settings()

# Create required directories on import
settings.create_required_directories()

# Make sure we're exporting settings
__all__ = ["settings"]