# app/api/v1/deployment.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.deployment import DeploymentCreate, Deployment
from app.models.deployment import Deployment as DeploymentModel

router = APIRouter()

@router.post("/create", response_model=Deployment)
def create_deployment(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    deployment_in: DeploymentCreate
) -> Any:
    """
    Create new deployment.
    """
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
    """
    Retrieve deployments.
    """
    deployments = db.query(DeploymentModel).filter(
        DeploymentModel.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return deployments