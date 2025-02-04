import os

# Memory optimization
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['MALLOC_ARENA_MAX'] = '2'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'

import numpy as np
np.set_printoptions(precision=4, suppress=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route to check deployment
@app.get("/")
def read_root():
    return {"message": "FastAPI app is live!"}

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))  # Ensure Render uses its assigned port
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        workers=1,
        loop="asyncio",
        limit_concurrency=1,
        limit_max_requests=50
    )
