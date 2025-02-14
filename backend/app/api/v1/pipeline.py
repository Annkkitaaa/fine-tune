from fastapi import APIRouter, Depends
from app.services.pipeline.integration import PipelineIntegrationService
from app.db.init_db import get_db  
router = APIRouter()

@router.post("/process")
async def process_data(
    request: ProcessDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pipeline_service = PipelineIntegrationService(config=settings.PIPELINE_CONFIG)
    
    results = await pipeline_service.process_dataset(
        data=request.data,
        pipeline_config=request.config,
        feature_names=request.feature_names,
        save_intermediate=True
    )
    
    return results