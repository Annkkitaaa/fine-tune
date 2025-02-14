# app/api/v1/pipeline.py
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.pipeline.integration import PipelineIntegrationService
from app.core.config import settings

router = APIRouter()

@router.post("/process")
async def process_data(
    request: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Process data through the pipeline
    """
    try:
        pipeline_service = PipelineIntegrationService(config=settings.PIPELINE_CONFIG)
        
        results = await pipeline_service.process_dataset(
            data=request.get('data'),
            pipeline_config=request.get('config', {}),
            feature_names=request.get('feature_names'),
            save_intermediate=True
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing data: {str(e)}"
        )

@router.get("/status/{pipeline_id}")
async def get_pipeline_status(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get pipeline processing status
    """
    try:
        pipeline_service = PipelineIntegrationService(config=settings.PIPELINE_CONFIG)
        return pipeline_service.get_pipeline_stats(pipeline_id)
        
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Pipeline not found: {str(e)}"
        )

@router.get("/visualizations/{pipeline_id}")
async def get_pipeline_visualizations(
    pipeline_id: str,
    analysis_type: str,
    feature: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get pipeline visualizations
    """
    try:
        pipeline_service = PipelineIntegrationService(config=settings.PIPELINE_CONFIG)
        return pipeline_service.get_visualization(
            pipeline_id=pipeline_id,
            analysis_type=analysis_type,
            feature=feature
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error getting visualization: {str(e)}"
        )

@router.delete("/cleanup/{pipeline_id}")
async def cleanup_pipeline_data(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Clean up pipeline data
    """
    try:
        pipeline_service = PipelineIntegrationService(config=settings.PIPELINE_CONFIG)
        await pipeline_service.clean_old_pipelines(pipeline_id=pipeline_id)
        return {"message": "Pipeline data cleaned successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error cleaning pipeline data: {str(e)}"
        )