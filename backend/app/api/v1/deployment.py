# app/api/v1/deployment.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.deployment import DeploymentCreate, Deployment
from app.models.deployment import Deployment as DeploymentModel
from app.services.deployment.service import ModelDeploymentService
from app.models.model import MLModel
from app.core.config import settings

router = APIRouter()

@router.post("/{deployment_id}/restart")
async def restart_deployment(
    deployment_id: int,
    background_tasks: BackgroundTasks,  # Move required parameters first
    db: Session = Depends(get_db),  # Then parameters with defaults
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Restart a stopped deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    if deployment.status == "active":
        raise HTTPException(
            status_code=400,
            detail="Deployment is already active"
        )
    
    try:
        model = db.query(MLModel).filter(MLModel.id == deployment.model_id).first()
        if not model:
            raise HTTPException(
                status_code=404,
                detail="Associated model not found"
            )
        
        # Start deployment in background
        background_tasks.add_task(
            deploy_model_task,
            deployment_id=deployment.id,
            db=db,
            model_path=model.file_path,
            preprocessor_path=model.preprocessor_path,
            framework=model.framework,
            config=deployment.config
        )
        
        deployment.status = "pending"
        db.commit()
        
        return {"status": "success", "message": "Deployment restart initiated"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error restarting deployment: {str(e)}"
        )

async def deploy_model_task(
    deployment_id: int,
    db: Session,
    model_path: str,
    preprocessor_path: str,
    framework: str,
    config: dict
) -> None:
    """Background task for model deployment"""
    try:
        # Get deployment record
        deployment = db.query(DeploymentModel).filter(
            DeploymentModel.id == deployment_id
        ).first()
        
        if not deployment:
            return
        
        # Update status to deploying
        deployment.status = "deploying"
        deployment.start_time = datetime.utcnow()
        db.commit()
        
        # Initialize deployment service
        service = ModelDeploymentService(
            model_path=model_path,
            preprocessor_path=preprocessor_path,
            framework=framework,
            config=config
        )
        
        # Load model
        await service.load_model()
        
        # Start service
        service.start(
            host=settings.DEPLOYMENT_HOST,
            port=deployment.config.get('port', settings.DEPLOYMENT_PORT)
        )
        
        # Update deployment status
        deployment.status = "active"
        deployment.endpoint_url = f"http://{settings.DEPLOYMENT_HOST}:{deployment.config.get('port', settings.DEPLOYMENT_PORT)}"
        deployment.end_time = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        # Update deployment status on failure
        if deployment:
            deployment.status = "failed"
            deployment.error_message = str(e)
            deployment.end_time = datetime.utcnow()
            db.commit()

@router.post("/create", response_model=Deployment)
async def create_deployment(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    deployment_in: DeploymentCreate
) -> Any:
    """Create new deployment."""
    try:
        deployment = DeploymentModel(
            name=deployment_in.name,
            description=deployment_in.description,
            model_id=deployment_in.model_id,
            config=deployment_in.config,
            status="pending",
            owner_id=current_user.id
        )
        
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        return deployment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error creating deployment: {str(e)}"
        )

@router.get("/list", response_model=List[Deployment])
def list_deployments(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve deployments."""
    deployments = db.query(DeploymentModel).filter(
        DeploymentModel.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return deployments

@router.get("/{deployment_id}", response_model=Deployment)
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Get deployment by ID."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    return deployment

@router.delete("/{deployment_id}")
async def delete_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Delete deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    try:
        if deployment.status == "active":
            deployment.status = "stopped"
            deployment.end_time = datetime.utcnow()
        
        db.delete(deployment)
        db.commit()
        
        return {"status": "success", "message": "Deployment deleted"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error deleting deployment: {str(e)}"
        )