from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.model import MLModelCreate, MLModel
from app.services.ml.training import PyTorchTrainer, TensorFlowTrainer, SklearnTrainer
from app.models.model import MLModel as MLModelDB

router = APIRouter()

def initialize_trainer(framework: str, config: dict = None):
    """Initialize appropriate trainer based on framework"""
    config = config or {}
    
    if framework == "pytorch":
        return PyTorchTrainer(model_config=config.get('model_config', {}), 
                            training_config=config.get('training_config', {}))
    elif framework == "tensorflow":
        return TensorFlowTrainer(model_config=config.get('model_config', {}), 
                               training_config=config.get('training_config', {}))
    elif framework == "sklearn":
        return SklearnTrainer(model_config=config.get('model_config', {}), 
                            training_config=config.get('training_config', {}))
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported framework: {framework}"
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
            framework=model_in.framework,
            config=model_in.config
        )
        
        # Create model record
        model = MLModelDB(
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
    models = db.query(MLModelDB).filter(
        MLModelDB.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return models