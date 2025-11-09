# app/api/v1/data.py
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.models.user import User
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
import uuid

from app.api.deps import get_db, get_current_user_or_default
from app.core.config import settings
from app.models.dataset import Dataset as DatasetModel
from app.schemas.dataset import Dataset, DatasetCreate
from app.services.data.preprocessing import DataPreprocessor
from app.services.data.validation import DataValidator

router = APIRouter()

@router.post("/upload", response_model=Dataset)
async def upload_data(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    preprocessing_config: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_default)
) -> Any:
    """Upload a dataset file with optional preprocessing."""
    try:
        owner_id = current_user.id

        # Extract file extension and check if allowed
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )

        # Create upload directory if it doesn't exist
        user_upload_dir = os.path.join(settings.UPLOAD_FOLDER, str(owner_id))
        os.makedirs(user_upload_dir, exist_ok=True)

        # Generate a unique filename to avoid overwriting
        if name:
            # Clean the name to be filesystem-safe
            clean_name = "".join(c for c in name if c.isalnum() or c in [' ', '_', '-']).strip()
            filename = f"{clean_name}{file_ext}"
        else:
            # Use original filename if no name provided
            filename = file.filename

        # Ensure filename is unique
        base_name = os.path.splitext(filename)[0]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{base_name}_{timestamp}{file_ext}"
        file_path = os.path.join(user_upload_dir, unique_filename)

        # Save file
        with open(file_path, "wb+") as file_object:
            file_object.write(await file.read())

        # Get file metadata
        file_size = os.path.getsize(file_path)
        
        # Extract basic info from the file
        num_rows = None
        num_features = None
        meta_info = {}
        
        try:
            # Load dataset to get metadata
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            elif file_ext == '.parquet':
                df = pd.read_parquet(file_path)
            elif file_ext in ['.xls', '.xlsx']:
                df = pd.read_excel(file_path)
            elif file_ext == '.json':
                df = pd.read_json(file_path)
            else:
                # If we can't read the file, skip metadata extraction
                df = None
                
            if df is not None:
                num_rows = len(df)
                num_features = len(df.columns)
                
                # Calculate basic statistics for metadata
                meta_info = {
                    "columns": list(df.columns),
                    "statistics": {
                        "numeric_columns": [
                            col for col in df.select_dtypes(include=[np.number]).columns
                        ],
                        "categorical_columns": [
                            col for col in df.select_dtypes(include=['object']).columns
                        ],
                        "missing_values": df.isnull().sum().to_dict(),
                        "sample_rows": min(5, len(df))
                    }
                }
        except Exception as e:
            # Log the error but continue - we don't want to fail the upload
            print(f"Error extracting dataset metadata: {str(e)}")
            
        # Parse preprocessing config if provided
        parsed_preprocessing_config = None
        if preprocessing_config:
            try:
                parsed_preprocessing_config = json.loads(preprocessing_config)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid preprocessing configuration format"
                )

        # Create dataset record with dynamic owner_id
        dataset = DatasetModel(
            name=name or os.path.splitext(file.filename)[0],
            description=description,
            file_path=file_path,
            format=file_ext.lstrip('.'),
            size=file_size,
            num_rows=num_rows,
            num_features=num_features,
            preprocessing_config=parsed_preprocessing_config,
            meta_info=meta_info,
            owner_id=owner_id  # Use dynamic owner_id instead of hardcoded value
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset
        
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
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve datasets with pagination."""
    try:
        datasets = (
            db.query(DatasetModel)
            # Removed user filtering for development
            .order_by(DatasetModel.created_at.desc())
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
    db: Session = Depends(get_db)
) -> Any:
    """Get a specific dataset by ID."""
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    return dataset

@router.get("/{dataset_id}/sample")
async def get_dataset_sample(
    dataset_id: int,
    limit: int = Query(100, ge=1, le=1000),
    columns: Optional[str] = None,
    filter_condition: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Get a sample of data from a dataset with optional filtering."""
    # Verify dataset exists
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    try:
        # Load the dataset
        file_path = dataset.file_path
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext == '.parquet':
            df = pd.read_parquet(file_path)
        elif file_ext in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
        elif file_ext == '.json':
            df = pd.read_json(file_path)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}"
            )
        
        # Filter columns if specified
        if columns:
            try:
                column_list = json.loads(columns)
                if isinstance(column_list, list):
                    # Keep only columns that exist in the dataset
                    valid_columns = [col for col in column_list if col in df.columns]
                    if valid_columns:
                        df = df[valid_columns]
            except json.JSONDecodeError:
                # If columns is not valid JSON, ignore it
                pass
        
        # Apply filter condition if specified
        if filter_condition:
            try:
                # SECURITY NOTE: In a production environment, you should use
                # a safer alternative than eval() for filtering
                # This is a simplified approach for demonstration
                filtered_df = df.query(filter_condition)
                if len(filtered_df) > 0:
                    df = filtered_df
            except Exception as e:
                # If filter fails, log the error but continue without filtering
                print(f"Error applying filter: {str(e)}")
        
        # Get datatypes for columns
        datatypes = {col: str(df[col].dtype) for col in df.columns}
        
        # Convert to dictionary for JSON response
        sample_data = df.head(limit).to_dict(orient='records')
        
        return {
            "data": sample_data,
            "columns": list(df.columns),
            "total_rows": len(df),
            "datatypes": datatypes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading dataset: {str(e)}"
        )

@router.post("/{dataset_id}/preprocess")
async def preprocess_dataset(
    dataset_id: int,
    preprocessing_request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Any:
    """Preprocess a dataset based on configuration."""
    # Verify dataset exists
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    try:
        process_id = str(uuid.uuid4())
        temp_dir = os.path.join(settings.TEMP_FOLDER, process_id)
        os.makedirs(temp_dir, exist_ok=True)
        # Extract preprocessing parameters
        preprocessing_config = preprocessing_request.get("preprocessing_config", {})
        selected_columns = preprocessing_request.get("selected_columns", [])
        filter_condition = preprocessing_request.get("filter_condition", "")
        
        # Load the dataset
        file_path = dataset.file_path
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext == '.parquet':
            df = pd.read_parquet(file_path)
        elif file_ext in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
        elif file_ext == '.json':
            df = pd.read_json(file_path)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}"
            )
        
        # Filter columns if specified
        if selected_columns:
            # Keep only columns that exist in the dataset
            valid_columns = [col for col in selected_columns if col in df.columns]
            if valid_columns:
                df = df[valid_columns]
        
        # Apply filter condition if specified
        if filter_condition:
            try:
                # SECURITY NOTE: In a production environment, you should use
                # a safer alternative than eval() for filtering
                filtered_df = df.query(filter_condition)
                if len(filtered_df) > 0:
                    df = filtered_df
            except Exception as e:
                # If filter fails, log the error but continue without filtering
                print(f"Error applying filter: {str(e)}")
        
        # Store original statistics for comparison
        original_rows = len(df)
        original_columns = len(df.columns)
        original_missing = df.isnull().sum().sum()
        
        # Count outliers using Z-score method
        original_outliers = 0
        for col in df.select_dtypes(include=[np.number]).columns:
            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
            original_outliers += len(z_scores[z_scores > 3])
        
        # Initialize preprocessor
        preprocessor = DataPreprocessor(config=preprocessing_config)
        
        # Create a unique ID for this preprocessing operation
        processed_id = str(uuid.uuid4())
        
        # Create temporary folder for processed data
        temp_dir = os.path.join(settings.TEMP_FOLDER, processed_id)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Process the data
        processed_file_path = os.path.join(temp_dir, f"processed_{dataset.name}.parquet")
        processed_df, stats = await preprocessor.process_pipeline(
            df,
            save_path=processed_file_path
        )
        
        # Convert processed data to DataFrame for statistics
        if not isinstance(processed_df, pd.DataFrame):
            processed_df = pd.DataFrame(processed_df, columns=selected_columns if selected_columns else df.columns)
        
        # Calculate post-processing statistics
        processed_rows = len(processed_df)
        processed_columns = len(processed_df.columns)
        processed_missing = processed_df.isnull().sum().sum()
        
        # Count outliers in processed data
        processed_outliers = 0
        for col in processed_df.select_dtypes(include=[np.number]).columns:
            z_scores = np.abs((processed_df[col] - processed_df[col].mean()) / processed_df[col].std())
            processed_outliers += len(z_scores[z_scores > 3])
        
        # Get sample of processed data
        sample_data = processed_df.head(100).to_dict(orient='records')
        
        # Return preprocessing results
        return {
            "processed_id": processed_id,
            "sample_data": sample_data,
            "original_rows": original_rows,
            "processed_rows": processed_rows,
            "original_columns": original_columns,
            "processed_columns": processed_columns,
            "original_missing": int(original_missing),
            "processed_missing": int(processed_missing),
            "original_outliers": int(original_outliers),
            "processed_outliers": int(processed_outliers),
            "column_stats": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error preprocessing dataset: {str(e)}"
        )

@router.post("/{dataset_id}/save-processed", response_model=Dataset)
async def save_processed_dataset(
    dataset_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Any:
    """Save a processed dataset as a new dataset."""
    # Verify dataset exists
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    try:
        # Extract parameters
        processed_id = request.get("processed_id")
        name = request.get("name", f"{dataset.name}_processed")
        description = request.get("description", f"Processed version of {dataset.name}")
        
        if not processed_id:
            raise HTTPException(
                status_code=400,
                detail="Missing processed_id parameter"
            )
        
        # Find the processed file
        temp_dir = os.path.join(settings.TEMP_FOLDER, processed_id)
        processed_file_path = os.path.join(temp_dir, f"processed_{dataset.name}.parquet")
        
        if not os.path.exists(processed_file_path):
            raise HTTPException(
                status_code=404,
                detail="Processed file not found. It may have expired."
            )
        
        # Create user directory if it doesn't exist
        # Using a fixed user_id=1 for development
        user_upload_dir = os.path.join(settings.UPLOAD_FOLDER, "1")
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Generate a unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        target_filename = f"{name}_{timestamp}.parquet"
        target_path = os.path.join(user_upload_dir, target_filename)
        
        # Copy the processed file to the user's directory
        import shutil
        shutil.copy2(processed_file_path, target_path)
        
        # Get file metadata
        file_size = os.path.getsize(target_path)
        
        # Load the processed dataset to get metadata
        df = pd.read_parquet(target_path)
        num_rows = len(df)
        num_features = len(df.columns)
        
        # Calculate basic statistics for metadata
        meta_info = {
            "columns": list(df.columns),
            "statistics": {
                "numeric_columns": [
                    col for col in df.select_dtypes(include=[np.number]).columns
                ],
                "categorical_columns": [
                    col for col in df.select_dtypes(include=['object']).columns
                ],
                "missing_values": df.isnull().sum().to_dict(),
                "sample_rows": min(5, len(df))
            },
            "processed_from": dataset_id
        }
        
        # Create new dataset record with hardcoded owner_id=1 for development
        new_dataset = DatasetModel(
            name=name,
            description=description,
            file_path=target_path,
            format="parquet",
            size=file_size,
            num_rows=num_rows,
            num_features=num_features,
            preprocessing_config=dataset.preprocessing_config,
            meta_info=meta_info,
            owner_id=1,  # Hardcoded for development
            project_id=dataset.project_id
        )
        
        db.add(new_dataset)
        db.commit()
        db.refresh(new_dataset)
        
        # Clean up temporary files
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"Warning: Failed to clean up temporary files: {str(e)}")
        
        return new_dataset
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving processed dataset: {str(e)}"
        )
    
@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Delete a dataset."""
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
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

@router.get("/{dataset_id}/download")
async def download_dataset(
    dataset_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Download a dataset file."""
    dataset = db.query(DatasetModel).filter(
        DatasetModel.id == dataset_id
        # Removed user filtering for development
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    if not os.path.exists(dataset.file_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset file not found"
        )
    
    # Get the filename from the path
    filename = os.path.basename(dataset.file_path)
    
    return FileResponse(
        path=dataset.file_path,
        filename=filename,
        media_type="application/octet-stream"
    )