# main.py
import uvicorn
from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.core.events import create_start_app_handler, create_stop_app_handler

# Configure environment variables for TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['CUDA_VISIBLE_DEVICES'] = '2'
os.environ['TF_NUM_INTEROP_THREADS'] = str(settings.TF_NUM_INTEROP_THREADS)
os.environ['TF_NUM_INTRAOP_THREADS'] = str(settings.TF_NUM_INTRAOP_THREADS)
os.environ['MALLOC_ARENA_MAX'] = '2'

import tensorflow as tf
# Configure TF for minimal memory usage
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )
    
    # Set CORS middleware
    if settings.BACKEND_CORS_ORIGINS:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    # Add event handlers
    application.add_event_handler("startup", create_start_app_handler(application))
    application.add_event_handler("shutdown", create_stop_app_handler(application))
    
    # Add routes
    application.include_router(api_router, prefix=settings.API_V1_STR)
    
    return application

app = create_application()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Use a single worker for reduced memory usage
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        reload=False
    )