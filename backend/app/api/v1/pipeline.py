# app/api/v1/pipeline.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import logging
from datetime import datetime
import json

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.pipeline import Pipeline
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.pipeline.integration import PipelineIntegrationService
from app.utils.serialization import convert_numpy_types, NumpyJSONEncoder
from typing import List
from app.schemas.pipeline import PipelineResponse, PipelineListResponse


router = APIRouter()
logger = logging.getLogger(__name__)

# app/api/v1/pipeline.py
@router.post("/process", response_model=PipelineResponse)
async def process_data(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: PipelineRequest
) -> Any:
    """Process data through the pipeline"""
    try:
        # Validate dataset exists
        dataset = db.query(Dataset).filter(
            Dataset.id == request.dataset_id,
            Dataset.owner_id == current_user.id
        ).first()

        if not dataset:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found"
            )

        if not dataset.file_path:
            raise HTTPException(
                status_code=400,
                detail="Dataset file path is missing"
            )

        # Create pipeline record
        pipeline_id = str(uuid.uuid4())
        pipeline = Pipeline(
            pipeline_id=pipeline_id,
            status="pending",
            config=request.config.dict(),
            owner_id=current_user.id,
            dataset_id=dataset.id
        )

        db.add(pipeline)
        db.commit()
        db.refresh(pipeline)

        try:
            # Initialize pipeline service
            pipeline_service = PipelineIntegrationService(config=request.config.dict())

            # Update status to running
            pipeline.update_status("running")
            db.commit()
            db.refresh(pipeline)  # Refresh to get updated timestamps

            # Process dataset
            results = await pipeline_service.process_dataset(
                data=dataset.file_path,
                pipeline_config=request.config.dict(),
                save_intermediate=True
            )

            if results is None:
                raise ValueError("Pipeline processing returned no results")

            # Convert numpy types to Python native types before storing
            converted_results = convert_numpy_types(results)

            # Update pipeline with results
            pipeline.results = converted_results
            pipeline.update_status("completed")
            db.commit()
            db.refresh(pipeline)  # Refresh to get final timestamps

            # Construct response with all required fields
            response = PipelineResponse(
                pipeline_id=pipeline_id,
                status="completed",
                dataset_id=request.dataset_id,
                config=request.config,
                results=converted_results,
                created_at=pipeline.created_at,
                updated_at=pipeline.updated_at,
                start_time=pipeline.start_time,
                end_time=pipeline.end_time,
                execution_time=pipeline.execution_time,
                error_message=pipeline.error_message
            )

            return response

        except Exception as e:
            logger.error(f"Pipeline processing error: {str(e)}")
            if pipeline:
                pipeline.update_status("failed", str(e))
                db.commit()
                db.refresh(pipeline)
            raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in pipeline processing: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error processing data: {str(e)}"
        )

@router.get("/list", response_model=List[PipelineListResponse])
async def list_pipelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """List all pipelines for the current user"""
    try:
        pipelines = (
            db.query(Pipeline)
            .filter(Pipeline.owner_id == current_user.id)
            .order_by(Pipeline.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return pipelines
        
    except Exception as e:
        logger.error(f"Error listing pipelines: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving pipelines: {str(e)}"
        )

@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get specific pipeline by ID"""
    try:
        pipeline = (
            db.query(Pipeline)
            .filter(
                Pipeline.pipeline_id == pipeline_id,
                Pipeline.owner_id == current_user.id
            )
            .first()
        )
        
        if not pipeline:
            raise HTTPException(
                status_code=404,
                detail="Pipeline not found"
            )
            
        return pipeline
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving pipeline: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving pipeline: {str(e)}"
        )

@router.delete("/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a pipeline"""
    try:
        pipeline = (
            db.query(Pipeline)
            .filter(
                Pipeline.pipeline_id == pipeline_id,
                Pipeline.owner_id == current_user.id
            )
            .first()
        )
        
        if not pipeline:
            raise HTTPException(
                status_code=404,
                detail="Pipeline not found"
            )
            
        # Delete any associated files if they exist
        if pipeline.results and 'file_paths' in pipeline.results:
            for file_path in pipeline.results['file_paths']:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Error deleting file {file_path}: {str(e)}")
        
        # Delete the pipeline record
        db.delete(pipeline)
        db.commit()
        
        return {"message": "Pipeline deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting pipeline: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting pipeline: {str(e)}"
        )