# app/api/v1/data.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.dataset import Dataset as DatasetModel
from app.schemas.dataset import Dataset, DatasetCreate  # Updated import

router = APIRouter()

@router.post("/upload")
async def upload_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Upload a dataset file."""
    try:
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )

        # Create user upload directory if it doesn't exist
        user_upload_dir = os.path.join(settings.UPLOAD_FOLDER, str(current_user.id))
        os.makedirs(user_upload_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(user_upload_dir, file.filename)
        with open(file_path, "wb+") as file_object:
            file_object.write(await file.read())

        # Create dataset record
        dataset = DatasetModel(
            name=file.filename,
            file_path=file_path,
            format=file_ext.lstrip('.'),
            owner_id=current_user.id
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return {
            "filename": file.filename,
            "id": dataset.id,
            "format": dataset.format,
            "message": "File uploaded successfully"
        }
        
    except Exception as e:
        # Cleanup if file was saved but database operation failed
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )

@router.get("/list", response_model=List[Dataset])
async def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve datasets."""
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

@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific dataset by ID."""
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id,
        DatasetModel.owner_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    return dataset

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a dataset."""
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id,
        DatasetModel.owner_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    try:
        # Delete file
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        
        # Delete database record
        db.delete(dataset)
        db.commit()
        
        return {"message": "Dataset deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting dataset: {str(e)}"
        )