from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.deployment import DeploymentCreate, Deployment
from app.services.deployment.deployer import deploy_model
from app.models.deployment import Deployment as DeploymentModel

router = APIRouter()

@router.post("/deploy", response_model=Deployment)
async def deploy(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    deployment_in: DeploymentCreate
) -> Any:
    """
    Deploy trained model.
    """
    # Deploy model
    deployment_config = await deploy_model(
        model_id=deployment_in.model_id,
        deployment_type=deployment_in.type
    )
    
    # Create deployment record
    deployment = DeploymentModel(
        model_id=deployment_in.model_id,
        type=deployment_in.type,
        config=deployment_config,
        status="active",
        owner_id=current_user.id
    )
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    return deployment

@router.delete("/{deployment_id}")
async def undeploy(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Undeploy model.
    """
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.id == deployment_id,
        DeploymentModel.owner_id == current_user.id
    ).first()
    if not deployment:
        raise HTTPException(404, "Deployment not found")
    
    # Update status
    deployment.status = "inactive"
    db.commit()
    return {"message": "Model undeployed successfully"}