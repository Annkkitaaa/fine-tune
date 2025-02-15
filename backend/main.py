import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router

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
            # Initialize async resources if needed
            pass
        except Exception as e:
            logger.error(f"Error during startup: {e}", exc_info=True)
            raise

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down application...")
        try:
            tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
            
            # Cancel tasks properly
            for task in tasks:
                task.cancel()
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle cancelled tasks
            cancelled_tasks = sum(1 for result in results if isinstance(result, asyncio.CancelledError))
            logger.info(f"Cancelled {cancelled_tasks}/{len(tasks)} tasks successfully.")

        except asyncio.CancelledError:
            logger.warning("Shutdown process was interrupted.")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)

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
