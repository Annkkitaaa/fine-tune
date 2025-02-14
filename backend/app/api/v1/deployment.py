from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_current_user, get_db
from app.schemas.deployment import DeploymentCreate, Deployment, DeploymentUpdate
from app.models.deployment import Deployment as DeploymentModel
from app.models.model import MLModel
from app.services.deployment.service import ModelDeploymentService
from app.core.config import settings

router = APIRouter()

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
    deployment_in: DeploymentCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """Create new deployment."""
    try:
        # Check if model exists
        model = db.query(MLModel).filter(MLModel.id == deployment_in.model_id).first()
        if not model:
            raise HTTPException(
                status_code=404,
                detail="Model not found"
            )
        
        # Check if model belongs to user
        if model.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )
        
        # Check active deployments count
        active_deployments = db.query(DeploymentModel).filter(
            DeploymentModel.owner_id == current_user.id,
            DeploymentModel.status.in_(["active", "deploying"])
        ).count()
        
        if active_deployments >= settings.MAX_DEPLOYMENTS:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum number of active deployments ({settings.MAX_DEPLOYMENTS}) reached"
            )
        
        # Create deployment record
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
        
        # Start deployment in background
        background_tasks.add_task(
            deploy_model_task,
            deployment_id=deployment.id,
            db=db,
            model_path=model.file_path,
            preprocessor_path=model.preprocessor_path,
            framework=model.framework,
            config=deployment_in.config
        )
        
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
    limit: int = 100,
    status: Optional[str] = None
) -> Any:
    """Retrieve deployments."""
    query = db.query(DeploymentModel).filter(
        DeploymentModel.owner_id == current_user.id
    )
    
    if status:
        query = query.filter(DeploymentModel.status == status)
    
    deployments = query.offset(skip).limit(limit).all()
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

@router.put("/{deployment_id}", response_model=Deployment)
def update_deployment(
    deployment_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    deployment_in: DeploymentUpdate
) -> Any:
    """Update deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    # Update fields
    for field, value in deployment_in.dict(exclude_unset=True).items():
        setattr(deployment, field, value)
    
    db.commit()
    db.refresh(deployment)
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
        # Stop the deployment service if running
        if deployment.status == "active":
            # Implementation to stop service
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

@router.post("/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Stop a running deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    if deployment.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Deployment is not active"
        )
    
    try:
        # Implementation to stop service
        deployment.status = "stopped"
        deployment.end_time = datetime.utcnow()
        db.commit()
        
        return {"status": "success", "message": "Deployment stopped"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error stopping deployment: {str(e)}"
        )

@router.post("/{deployment_id}/restart")
async def restart_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    background_tasks: BackgroundTasks
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