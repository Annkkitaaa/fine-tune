# app/api/v1/data.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import json
from typing import Any
from typing import List

from app.api.deps import get_current_user, get_db
from app.schemas.dataset import DatasetCreate, Dataset
from app.models.dataset import Dataset as DatasetModel
from app.core.config import settings
import os

router = APIRouter()

@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    file: UploadFile = File(...),
    dataset_info: str = Form(...)
) -> Any:
    """
    Upload new dataset.
    """
    try:
        # Parse dataset_info from string to dict
        dataset_info = json.loads(dataset_info)
        dataset_create = DatasetCreate(**dataset_info)

        # Validate file format
        if not file.filename.endswith(('.csv', '.json', '.parquet')):
            raise HTTPException(400, "Invalid file format")

        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(settings.UPLOAD_FOLDER, str(current_user.id))
        os.makedirs(upload_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Create dataset record
        dataset = DatasetModel(
            name=dataset_create.name,
            description=dataset_create.description,
            format=dataset_create.format,
            file_path=file_path,
            owner_id=current_user.id,
            size=len(content) / (1024 * 1024)  # size in MB
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset

    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid dataset_info JSON format")
    except Exception as e:
        raise HTTPException(500, f"Error uploading dataset: {str(e)}")


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
    try:
        datasets = (
            db.query(DatasetModel)
            .filter(DatasetModel.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return datasets
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving datasets: {str(e)}"
        )