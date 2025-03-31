# app/core/logging.py
import logging
import sys
from typing import Any, Dict, List

from loguru import logger
from pydantic import BaseModel


class LogConfig(BaseModel):
    """Logging configuration"""

    LOGGER_NAME: str = "fine_tune_labs"
    LOG_FORMAT: str = "[{time:YYYY-MM-DD HH:mm:ss}] {level} | {name}:{function}:{line} - {message}"
    LOG_LEVEL: str = "DEBUG"

    # Logger configuration
    version: int = 1
    disable_existing_loggers: bool = False
    formatters: Dict[str, Dict[str, Any]] = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": None,
        },
    }
    handlers: Dict[str, Dict[str, Any]] = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers: Dict[str, Dict[str, Any]] = {
        LOGGER_NAME: {"handlers": ["default"], "level": LOG_LEVEL},
    }


def setup_logging():
    """Set up logging configuration"""
    logger.remove()
    logger.add(sys.stderr, format=LogConfig.LOG_FORMAT, level=LogConfig.LOG_LEVEL)
    
    # Configure standard library loggers
    logging.basicConfig(
        level=logging.INFO,
        format=LogConfig.LOG_FORMAT,
        handlers=[logging.StreamHandler(sys.stdout)]
    )

    # Set specific module log levels
    logging.getLogger("app.api").setLevel(logging.DEBUG)
    logging.getLogger("app.services.auth").setLevel(logging.DEBUG)

setup_logging()