# app/api/v1/__init__.py
from fastapi import APIRouter

from .auth import router as auth_router
from .data import router as data_router
from .deployment import router as deployment_router
from .evaluation import router as evaluation_router
from .models import router as models_router
from .pipeline import router as pipeline_router
from .training import router as training_router
from .user import router as user_router

api_router = APIRouter()

# Mount all routers
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(data_router, prefix="/data", tags=["data"])
api_router.include_router(deployment_router, prefix="/deployment", tags=["deployment"])
api_router.include_router(evaluation_router, prefix="/evaluation", tags=["evaluation"])
api_router.include_router(models_router, prefix="/models", tags=["models"])
api_router.include_router(pipeline_router, prefix="/pipeline", tags=["pipeline"])
api_router.include_router(training_router, prefix="/training", tags=["training"])
api_router.include_router(user_router, prefix="/users", tags=["users"])