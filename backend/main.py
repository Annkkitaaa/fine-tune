# main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
import logging
from typing import Callable
import asyncio

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="API documentation for ML Model Fine-Tuning Service",
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event():
        logger.info("Starting up application...")
        try:
            # Initialize any async resources here
            pass
        except Exception as e:
            logger.error(f"Error during startup: {e}")
            raise

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down application...")
        try:
            # Clean up any async resources here
            tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
            [task.cancel() for task in tasks]
            await asyncio.gather(*tasks, return_exceptions=True)
            logger.info(f"Cancelled {len(tasks)} tasks")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            raise

    # Root route to check deployment
    @app.get("/")
    async def read_root():
        return {"message": "FastAPI app is live!"}

    # Include API routes
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        loop="asyncio",
        limit_concurrency=100,
        limit_max_requests=1000,
        timeout_keep_alive=5,
        reload=True
    )