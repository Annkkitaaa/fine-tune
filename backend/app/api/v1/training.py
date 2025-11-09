from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user_or_default
from app.schemas.training import TrainingCreate, Training
from app.services.ml.training.trainer import start_training_job
from app.models.training import Training as TrainingModel

router = APIRouter()

@router.post("/create", response_model=Training)
async def create_training(
    *,
    db: Session = Depends(get_db),
    current_user: Optional[Any] = Depends(get_optional_user),
    training_in: TrainingCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Start model training.
    """
    try:
        # Create training job record
        training = TrainingModel(
            model_id=training_in.model_id,
            dataset_id=training_in.dataset_id,
            hyperparameters=training_in.hyperparameters or {},
            status="queued",
            owner_id=current_user.id if current_user else 1,
            updated_at=datetime.utcnow()
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Could not create training: {str(e)}")

@router.get("/list", response_model=List[Training])
async def list_trainings(
    db: Session = Depends(get_db),
    current_user: Optional[Any] = Depends(get_optional_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all training jobs.
    """
    try:
        # If no authenticated user, use mock user ID
        owner_id = current_user.id if current_user else 1
        
        trainings = db.query(TrainingModel).filter(
            TrainingModel.owner_id == owner_id
        ).order_by(
            TrainingModel.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return trainings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trainings: {str(e)}")

@router.get("/{training_id}", response_model=Training)
async def get_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[Any] = Depends(get_optional_user)
) -> Any:
    """
    Get training job details.
    """
    try:
        query = db.query(TrainingModel).filter(TrainingModel.id == training_id)
        
        # Add owner filter only if authenticated
        if current_user:
            query = query.filter(TrainingModel.owner_id == current_user.id)
        
        training = query.first()
        
        if not training:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        return training
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving training: {str(e)}")

@router.post("/{training_id}/cancel")
async def cancel_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[Any] = Depends(get_optional_user)
) -> Any:
    """
    Cancel running training job.
    """
    try:
        query = db.query(TrainingModel).filter(TrainingModel.id == training_id)
        
        # Add owner filter only if authenticated
        if current_user:
            query = query.filter(TrainingModel.owner_id == current_user.id)
        
        training = query.first()
        
        if not training:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        if training.status not in ["queued", "running"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel training with status '{training.status}'"
            )
        
        # Update status to cancelled
        training.status = "cancelled"
        training.updated_at = datetime.utcnow()
        if training.start_time:
            training.end_time = datetime.utcnow()
        
        db.commit()
        db.refresh(training)
        
        return {"message": "Training cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error cancelling training: {str(e)}")