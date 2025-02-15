# app/core/__init__.py
from .config import settings
from .security import verify_password, get_password_hash
from .lifecycle import (
    AppLifecycle,  # Note the lowercase 'c'
    lifecycle,     # Export the lifecycle instance
    setup_lifecycle_handlers,
    lifespan
)

__all__ = [
    "settings",
    "verify_password",
    "get_password_hash",
    "AppLifecycle",
    "lifecycle",
    "setup_lifecycle_handlers",
    "lifespan"
]