from typing import Callable
from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.db.session import engine
from app.db.init_db import init_db
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def create_start_app_handler(app: FastAPI) -> Callable:
    """
    FastAPI startup event handler
    """
    async def start_app() -> None:
        try:
            # Initialize logging
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            
            # Initialize database
            logger.info("Creating initial data")
            init_db(engine)
            
            # Setup monitoring if enabled
            if settings.ENABLE_METRICS:
                logger.info("Setting up monitoring")
                setup_monitoring()
            
            # Initialize ML model services
            logger.info("Initializing ML services")
            initialize_ml_services()
            
            logger.info("Startup complete")
            
        except Exception as e:
            logger.error(f"Error during startup: {str(e)}")
            raise e

    return start_app

def create_stop_app_handler(app: FastAPI) -> Callable:
    """
    FastAPI shutdown event handler
    """
    async def stop_app() -> None:
        try:
            # Cleanup resources
            logger.info("Cleaning up resources")
            
            # Stop any running training jobs
            logger.info("Stopping training jobs")
            cleanup_training_jobs()
            
            # Close database connections
            logger.info("Closing database connections")
            engine.dispose()
            
            # Cleanup monitoring
            if settings.ENABLE_METRICS:
                logger.info("Cleaning up monitoring")
                cleanup_monitoring()
            
            logger.info("Shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")
            raise e

    return stop_app

def setup_monitoring():
    """
    Setup monitoring and metrics collection
    """
    # Initialize metrics collectors
    from prometheus_client import start_http_server
    start_http_server(settings.METRICS_PORT, settings.METRICS_HOST)

def cleanup_monitoring():
    """
    Cleanup monitoring resources
    """
    # Cleanup any monitoring resources
    pass

def initialize_ml_services():
    """
    Initialize machine learning services
    """
    # Initialize ML framework handlers
    for framework in settings.SUPPORTED_FRAMEWORKS:
        logger.info(f"Initializing {framework} framework")
        # Initialize framework-specific services

def cleanup_training_jobs():
    """
    Cleanup any running training jobs
    """
    # Stop any running training jobs gracefully
    pass

# Additional utility functions for the core module
def setup_middleware(app: FastAPI) -> None:
    """
    Setup middleware for the application
    """
    from fastapi.middleware.cors import CORSMiddleware
    
    # Setup CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add other middleware as needed
    # Example: Authentication middleware, compression, etc.

def setup_routers(app: FastAPI) -> None:
    """
    Setup API routes
    """
    from app.api.v1 import api_router
    app.include_router(api_router, prefix=settings.API_V1_STR)