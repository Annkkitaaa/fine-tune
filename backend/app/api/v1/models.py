from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.model import MLModelCreate, MLModel
from app.services.ml.training import PyTorchTrainer, TensorFlowTrainer, SklearnTrainer
from app.models.model import MLModel

router = APIRouter()

def initialize_trainer(architecture: str, model_config: dict = None, training_config: dict = None):
    """Initialize appropriate trainer based on architecture"""
    model_config = model_config or {}
    training_config = training_config or {}
    
    if architecture == "pytorch":
        return PyTorchTrainer(model_config=model_config, training_config=training_config)
    elif architecture == "tensorflow":
        return TensorFlowTrainer(model_config=model_config, training_config=training_config)
    elif architecture == "sklearn":
        return SklearnTrainer(model_config=model_config, training_config=training_config)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model architecture: {architecture}"
        )

@router.post("/create", response_model=MLModel)
def create_model(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    model_in: MLModelCreate
) -> Any:
    """
    Create new model.
    """
    try:
        # Initialize trainer with configurations
        trainer = initialize_trainer(
            architecture=model_in.architecture,
            model_config=getattr(model_in, 'model_config', {}),
            training_config=getattr(model_in, 'training_config', {})
        )
        
        # Create model record
        model = MLModel(
            name=model_in.name,
            architecture=model_in.architecture,
            model_config=trainer.model_config,
            training_config=trainer.training_config,
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

@router.get("/list", response_model=List[MLModel])
def list_models(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve models.
    """
    models = db.query(MLModel).filter(
        MLModel.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return models