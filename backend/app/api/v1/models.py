# app/api/v1/models.py
# Updated imports
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user, get_db  # <-- Use the optional user dependency
from app.models.user import User
from app.models.model import MLModel
from app.schemas.model import MLModelCreate, MLModel as MLModelSchema

router = APIRouter()

# Mock user for development without authentication
MOCK_USER_ID = 1

@router.post("/create", response_model=MLModelSchema)
async def create_model(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),  # <-- Use optional user
    model_in: MLModelCreate
) -> Any:
    """Create new model."""
    try:
        # Use mock user ID if no authenticated user
        owner_id = current_user.id if current_user else MOCK_USER_ID
        
        model = MLModel(
            name=model_in.name,
            description=model_in.description,
            framework=model_in.framework,
            architecture=model_in.architecture,
            version=model_in.version,
            config=model_in.config,
            hyperparameters=model_in.hyperparameters,
            owner_id=owner_id
        )
        
        db.add(model)
        db.commit()
        db.refresh(model)
        return model
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error creating model: {str(e)}"
        )

# Update the rest of the endpoints similarly
@router.get("/list", response_model=List[MLModelSchema])
async def list_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),  # <-- Use optional user
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve models."""
    # For development: if no user, show all models or models with the mock user ID
    if current_user:
        owner_id = current_user.id
    else:
        owner_id = MOCK_USER_ID
        
    models = (
        db.query(MLModel)
        .filter(MLModel.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return models

@router.get("/{model_id}", response_model=MLModelSchema)
async def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)  # <-- Use optional user
) -> Any:
    """Get model by ID."""
    query = db.query(MLModel).filter(MLModel.id == model_id)
    
    # Add owner filter only if authenticated
    if current_user:
        query = query.filter(MLModel.owner_id == current_user.id)
    
    model = query.first()
    
    if not model:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )
    
    return model

@router.delete("/{model_id}")
async def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)  # <-- Use optional user
) -> Any:
    """Delete model."""
    query = db.query(MLModel).filter(MLModel.id == model_id)
    
    # Add owner filter only if authenticated
    if current_user:
        query = query.filter(MLModel.owner_id == current_user.id)
    
    model = query.first()
    
    if not model:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )
    
    try:
        db.delete(model)
        db.commit()
        return {"message": "Model deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error deleting model: {str(e)}"
        )