# app/api/v1/deployment.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_current_user_or_default, get_db
from app.schemas.deployment import DeploymentCreate, Deployment, SpheronDeploymentCreate
from app.models.deployment import Deployment as DeploymentModel
from app.services.deployment.service import ModelDeploymentService
from app.models.model import MLModel
from app.core.config import settings

router = APIRouter()


@router.post("/{deployment_id}/restart")
async def restart_deployment(
    deployment_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default)
) -> Any:
    """Restart a stopped deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        # Temporarily commented out for development
        # DeploymentModel.owner_id == current_user.id
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
    
# Add a new endpoint for Spheron deployments
@router.post("/spheron", response_model=Deployment)
async def deploy_with_spheron(
    *,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default),
    deployment_in: SpheronDeploymentCreate
):
    """Deploy model using Spheron Protocol"""
    try:
        # Get the model
        model = db.query(MLModel).filter(
            MLModel.id == deployment_in.model_id,
            # Temporarily commented out for development
            # MLModel.owner_id == current_user.id
        ).first()
        
        if not model:
            raise HTTPException(404, "Model not found")
        
        # Create deployment record with spheron provider
        deployment = DeploymentModel(
            name=deployment_in.name,
            description=deployment_in.description,
            model_id=deployment_in.model_id,
            provider="spheron",
            config=deployment_in.config.dict(),
            status="pending",
            # Temporarily using a placeholder user ID
            owner_id=1  # Replace with current_user.id when reenabling auth
        )
        
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        
        # Initialize deployment service
        service = ModelDeploymentService(
            model_path=model.file_path,
            preprocessor_path=model.preprocessor_path,
            framework=model.framework,
            config=deployment_in.config.dict()
        )
        
        # Deploy with Spheron
        spheron_result = await service.deploy_with_spheron()
        
        # Update deployment with Spheron details
        deployment.provider_deployment_id = spheron_result.get("deployment_id")
        deployment.endpoint_url = spheron_result.get("endpoint_url")
        deployment.status = spheron_result.get("status", "pending")
        db.commit()
        
        return deployment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error creating Spheron deployment: {str(e)}"
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
        
        # Different deployment logic based on provider
        if deployment.provider == "spheron":
            # For Spheron deployments, we check status
            if deployment.provider_deployment_id:
                status = await service.spheron_service.check_deployment_status(
                    deployment.provider_deployment_id
                )
                if status.get("status") == "active":
                    deployment.status = "active"
                    deployment.end_time = datetime.utcnow()
                    db.commit()
                elif status.get("status") in ["failed", "error"]:
                    deployment.status = "failed"
                    deployment.error_message = "Spheron deployment failed"
                    deployment.end_time = datetime.utcnow()
                    db.commit()
        else:
            # Standard deployment logic for local deployments
            try:
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
                deployment.status = "failed"
                deployment.error_message = str(e)
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
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default),
    deployment_in: DeploymentCreate
) -> Any:
    """Create new local deployment."""
    try:
        deployment = DeploymentModel(
            name=deployment_in.name,
            description=deployment_in.description,
            model_id=deployment_in.model_id,
            config=deployment_in.config,
            status="pending",
            # Temporarily using a placeholder user ID
            owner_id=1  # Replace with current_user.id when reenabling auth
        )
        
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        
        # Start deployment in background
        model = db.query(MLModel).filter(MLModel.id == deployment_in.model_id).first()
        if model:
            background_tasks = BackgroundTasks()
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
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve deployments."""
    deployments = db.query(DeploymentModel).offset(skip).limit(limit).all()
    return deployments

@router.get("/{deployment_id}", response_model=Deployment)
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default)
) -> Any:
    """Get deployment by ID."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        # Temporarily commented out for development
        # DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    return deployment

@router.post("/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default)
) -> Any:
    """Stop a running deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        # Temporarily commented out for development
        # DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    if deployment.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Deployment is not active (current status: {deployment.status})"
        )
    
    try:
        if deployment.provider == "spheron" and deployment.provider_deployment_id:
            # Stop Spheron deployment
            service = ModelDeploymentService(
                model_path="",  # Not needed for stopping
                preprocessor_path="",  # Not needed for stopping
                framework="",  # Not needed for stopping
                config=deployment.config
            )
            
            await service.spheron_service.stop_deployment(deployment.provider_deployment_id)
        
        # Update deployment status
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

@router.delete("/{deployment_id}")
async def delete_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default)
) -> Any:
    """Delete deployment."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        # Temporarily commented out for development
        # DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    try:
        if deployment.status == "active":
            if deployment.provider == "spheron" and deployment.provider_deployment_id:
                # Stop Spheron deployment first
                service = ModelDeploymentService(
                    model_path="",  # Not needed for stopping
                    preprocessor_path="",  # Not needed for stopping
                    framework="",  # Not needed for stopping
                    config=deployment.config
                )
                
                try:
                    await service.spheron_service.stop_deployment(deployment.provider_deployment_id)
                except Exception as e:
                    # Continue with deletion even if stopping fails
                    print(f"Error stopping Spheron deployment: {str(e)}")
            
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

@router.get("/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: int,
    lines: int = 100,
    db: Session = Depends(get_db),
    # Temporarily commented out for development
    # current_user = Depends(get_current_user_or_default)
) -> Any:
    """Get deployment logs."""
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        # Temporarily commented out for development
        # DeploymentModel.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=404,
            detail="Deployment not found"
        )
    
    try:
        if deployment.provider == "spheron" and deployment.provider_deployment_id:
            # Get Spheron deployment logs
            service = ModelDeploymentService(
                model_path="",  # Not needed for logs
                preprocessor_path="",  # Not needed for logs
                framework="",  # Not needed for logs
                config=deployment.config
            )
            
            logs = await service.spheron_service.get_deployment_logs(
                deployment.provider_deployment_id, 
                lines
            )
            
            return {"logs": logs.get("logs", "")}
        else:
            # For local deployments, return placeholder logs for now
            return {"logs": "Log retrieval for local deployments not implemented yet"}
            
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error retrieving logs: {str(e)}"
        )