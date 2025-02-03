from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.dataset import DatasetCreate, Dataset
from app.services.data.preprocessing import process_dataset
from app.models.dataset import Dataset as DatasetModel

router = APIRouter()

@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    file: UploadFile = File(...),
    dataset_info: DatasetCreate
) -> Any:
    """
    Upload new dataset.
    """
    # Validate file
    if not file.filename.endswith(('.csv', '.json', '.parquet')):
        raise HTTPException(400, "Invalid file format")
    
    # Process dataset
    processed_data = await process_dataset(file)
    
    # Create dataset record
    dataset = DatasetModel(
        name=dataset_info.name,
        description=dataset_info.description,
        file_path=processed_data.path,
        owner_id=current_user.id
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

@router.get("/list", response_model=List[Dataset])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve datasets.
    """
    datasets = db.query(DatasetModel).filter(
        DatasetModel.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return datasets