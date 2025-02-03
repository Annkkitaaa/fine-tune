from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.model import ModelCreate, Model
from app.services.ml.training import initialize_model
from app.models.model import Model as ModelModel

router = APIRouter()

@router.post("/create", response_model=Model)
def create_model(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    model_in: ModelCreate
) -> Any:
    """
    Create new model.
    """
    # Initialize model
    model_config = initialize_model(model_in.architecture)
    
    # Create model record
    model = ModelModel(
        name=model_in.name,
        architecture=model_in.architecture,
        config=model_config,
        owner_id=current_user.id
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model

@router.get("/list", response_model=List[Model])
def list_models(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve models.
    """
    models = db.query(ModelModel).filter(
        ModelModel.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return models