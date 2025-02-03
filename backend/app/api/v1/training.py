from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.training import TrainingCreate, Training
from app.services.ml.training.trainer import start_training_job
from app.models.training import Training as TrainingModel

router = APIRouter()

@router.post("/start", response_model=Training)
async def start_training(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    training_in: TrainingCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Start model training.
    """
    # Create training job record
    training = TrainingModel(
        model_id=training_in.model_id,
        dataset_id=training_in.dataset_id,
        hyperparameters=training_in.hyperparameters,
        status="queued",
        owner_id=current_user.id
    )
    db.add(training)
    db.commit()
    db.refresh(training)
    
    # Start training in background
    background_tasks.add_task(
        start_training_job,
        training_id=training.id,
        db=db
    )
    
    return training

@router.get("/{training_id}/status", response_model=Training)
def get_training_status(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Get training job status.
    """
    training = db.query(TrainingModel).filter(
        TrainingModel.id == training_id,
        TrainingModel.owner_id == current_user.id
    ).first()
    if not training:
        raise HTTPException(404, "Training job not found")
    return training