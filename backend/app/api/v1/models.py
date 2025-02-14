# app/api/v1/models.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.model import MLModel
from app.schemas.model import MLModelCreate, MLModel as MLModelSchema

router = APIRouter()

@router.post("/create", response_model=MLModelSchema)
async def create_model(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    model_in: MLModelCreate
) -> Any:
    """Create new model."""
    try:
        model = MLModel(
            name=model_in.name,
            description=model_in.description,
            framework=model_in.framework,
            architecture=model_in.architecture,
            version=model_in.version,
            config=model_in.config,
            hyperparameters=model_in.hyperparameters,
            owner_id=current_user.id
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

@router.get("/list", response_model=List[MLModelSchema])
async def list_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve models."""
    models = (
        db.query(MLModel)
        .filter(MLModel.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return models

@router.get("/{model_id}", response_model=MLModelSchema)
async def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get model by ID."""
    model = db.query(MLModel).filter(
        MLModel.id == model_id,
        MLModel.owner_id == current_user.id
    ).first()
    
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
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete model."""
    model = db.query(MLModel).filter(
        MLModel.id == model_id,
        MLModel.owner_id == current_user.id
    ).first()
    
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