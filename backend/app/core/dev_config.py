# app/core/dev_config.py
"""
Development configuration to enable/disable authentication
Import this in auth-related functionality to bypass auth checks in development
"""
import os

# Auto-detect development environment
is_development = os.getenv("DEBUG") == "1" or os.getenv("ENVIRONMENT") == "development"

# Set to True to bypass authentication checks
BYPASS_AUTH = is_development

# Mock user data for development when auth is bypassed
MOCK_USER = {
    "id": 1,
    "email": "dev@example.com",
    "full_name": "Development User",
    "is_active": True,
    "is_superuser": True,
    "created_at": None,  # Will be set by DB if user needs to be created
    "updated_at": None   # Will be set by DB if user needs to be created
}