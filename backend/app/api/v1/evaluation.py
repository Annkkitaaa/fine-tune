# app/api/v1/evaluation.py
from typing import Any, Dict, Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import numpy as np
import time
import os
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, r2_score, mean_absolute_error, confusion_matrix
)
from sklearn.model_selection import train_test_split
import torch
import tensorflow as tf
from datetime import datetime
import logging

from app.api.deps import get_db, get_current_user_or_default
from app.schemas.evaluation import EvaluationCreate, Evaluation
from app.models.evaluation import Evaluation as EvaluationModel
from app.services.ml.training.trainer import load_dataset
from app.models.model import MLModel
from app.models.dataset import Dataset

logger = logging.getLogger(__name__)
router = APIRouter()

def format_confusion_matrix(conf_matrix: np.ndarray) -> Dict[str, Any]:
    """Format confusion matrix into a dictionary format expected by the schema"""
    return {
        "matrix": conf_matrix.tolist(),
        "labels": [str(i) for i in range(conf_matrix.shape[0])],
    }

def is_classification_model(model: MLModel) -> bool:
    """
    Determine if a model is for classification based on its metadata or properties
    """
    # Check model metadata if available
    if hasattr(model, 'task_type') and model.task_type is not None:
        return model.task_type.lower() in ['classification', 'multiclass', 'binary']
    
    # Try to infer from model properties
    if hasattr(model, 'n_classes_') or hasattr(model, 'classes_'):
        return True
    
    # Default to False if unable to determine
    return False

def is_classification_data(y: np.ndarray) -> bool:
    """
    Check if the target data is for classification based on its characteristics
    """
    try:
        # Convert to numpy array if it's not already
        y_array = np.array(y)
        
        # Get unique values
        unique_values = np.unique(y_array)
        
        # Classification typically has few unique values
        if len(unique_values) < 10:
            return True
            
        # Check if values are integers or close to integers in a reasonable range
        if np.all(np.isclose(y_array, np.round(y_array), rtol=1e-5)) and len(unique_values) < 100:
            return True
            
        # If all values are between 0 and 1, it might be probabilities for binary classification
        if np.all(y_array >= 0) and np.all(y_array <= 1) and len(y_array.shape) == 1:
            # Check if values cluster around 0 and 1
            counts_near_0 = np.sum(y_array < 0.1)
            counts_near_1 = np.sum(y_array > 0.9)
            if (counts_near_0 + counts_near_1) / len(y_array) > 0.8:
                return True
        
        return False
    except Exception as e:
        logger.warning(f"Error checking if data is classification: {str(e)}")
        return False

async def make_predictions(model: MLModel, X: np.ndarray) -> np.ndarray:
    """Make predictions using the appropriate framework"""
    try:
        if not hasattr(model, 'file_path') or not model.file_path:
            logger.warning("Model file path not found, using mock predictions")
            return np.zeros(len(X))  # Mock predictions

        if model.framework == "pytorch":
            # Load PyTorch model
            if not os.path.exists(model.file_path):
                logger.warning(f"PyTorch model file not found at {model.file_path}")
                return np.zeros(len(X))
                
            model_state = torch.load(model.file_path)
            pytorch_model = model_state.get('model')
            if not pytorch_model:
                return np.zeros(len(X))
                
            pytorch_model.eval()
            with torch.no_grad():
                X_tensor = torch.FloatTensor(X)
                predictions = pytorch_model(X_tensor).numpy()
                
        elif model.framework == "tensorflow":
            # Load TensorFlow model
            if not os.path.exists(model.file_path):
                logger.warning(f"TensorFlow model file not found at {model.file_path}")
                return np.zeros(len(X))
                
            tf_model = tf.keras.models.load_model(model.file_path)
            predictions = tf_model.predict(X)
            
        elif model.framework == "sklearn":
            # Load scikit-learn model
            if not os.path.exists(model.file_path):
                logger.warning(f"Scikit-learn model file not found at {model.file_path}")
                return np.zeros(len(X))
                
            import joblib
            sklearn_model = joblib.load(model.file_path)
            predictions = sklearn_model.predict(X)
            
        else:
            logger.warning(f"Unsupported framework: {model.framework}")
            return np.zeros(len(X))
            
        return predictions.squeeze()
        
    except Exception as e:
        logger.error(f"Error making predictions: {str(e)}")
        return np.zeros(len(X))  # Return mock predictions on error

def calculate_feature_importance(model, X: np.ndarray, feature_names: Optional[List[str]] = None) -> Dict[str, float]:
    """Calculate feature importance based on model type"""
    try:
        # Generate feature names if not provided
        if not feature_names:
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]
            
        # Default equal importance
        default_importance = {feature_names[i]: 1.0/X.shape[1] for i in range(X.shape[1])}
        
        # Check if model object has feature_importances_ attribute (sklearn-style)
        if hasattr(model, 'feature_importances_'):
            return {feature_names[i]: float(imp) for i, imp in enumerate(model.feature_importances_)}
        
        # Check for model-specific feature importance methods
        if model.framework == "sklearn":
            # For some sklearn models
            if hasattr(model, 'coef_'):
                coefs = model.coef_.ravel() if hasattr(model.coef_, 'ravel') else model.coef_
                abs_coefs = np.abs(coefs)
                sum_abs = np.sum(abs_coefs) if np.sum(abs_coefs) != 0 else 1.0
                return {feature_names[i]: float(abs_coefs[i] / sum_abs) for i in range(len(coefs))}
        
        # For gradient-boosting models
        if hasattr(model, 'feature_importances_'):
            return {feature_names[i]: float(imp) for i, imp in enumerate(model.feature_importances_)}
            
        return default_importance
    except Exception as e:
        logger.warning(f"Could not calculate feature importance: {str(e)}")
        return {f"feature_{i}": 1.0/X.shape[1] for i in range(X.shape[1])}

@router.post("/{model_id}/evaluate", response_model=Evaluation)
async def evaluate_model(
    model_id: int,
    *,
    db: Session = Depends(get_db),
    # Temporarily removed authentication: current_user: Any = Depends(get_current_user),
    evaluation_in: EvaluationCreate
) -> Any:
    """Evaluate a model on a given dataset."""
    start_time = datetime.utcnow()
    
    try:
        # Get model and dataset
        model = db.query(MLModel).filter(MLModel.id == model_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == evaluation_in.dataset_id).first()
        
        if not model:
            raise HTTPException(404, f"Model with ID {model_id} not found")
        if not dataset:
            raise HTTPException(404, f"Dataset with ID {evaluation_in.dataset_id} not found")

        # Load dataset
        data = load_dataset(dataset)
        if not isinstance(data, tuple) or len(data) != 2:
            raise HTTPException(400, "Invalid dataset format")
        
        X, y = data
        
        # Get feature names if available
        feature_names = getattr(dataset, 'feature_names', None)
        if not feature_names and hasattr(X, 'columns'):
            feature_names = X.columns.tolist()
        else:
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]

        # Split data
        test_split = evaluation_in.parameters.test_split
        random_seed = evaluation_in.parameters.random_seed
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=test_split,
            random_state=random_seed
        )

        # Make predictions
        y_pred = await make_predictions(model, X_test)
        
        # Determine if this is a classification or regression task
        is_classification_task = is_classification_model(model) or is_classification_data(y)
        
        logger.info(f"Task type detected: {'Classification' if is_classification_task else 'Regression'}")
        
        # Calculate metrics based on task type
        metrics = {}
        metrics_config = evaluation_in.metrics
        
        if is_classification_task:
            try:
                # Try to convert predictions to integer class labels if needed
                y_test_classes = np.round(y_test).astype(int)
                y_pred_classes = np.round(y_pred).astype(int)
                
                # Classification metrics
                if metrics_config.accuracy:
                    metrics['accuracy'] = float(accuracy_score(y_test_classes, y_pred_classes))
                if metrics_config.precision:
                    metrics['precision'] = float(precision_score(y_test_classes, y_pred_classes, average='weighted', zero_division=0))
                if metrics_config.recall:
                    metrics['recall'] = float(recall_score(y_test_classes, y_pred_classes, average='weighted', zero_division=0))
                if metrics_config.f1_score:
                    metrics['f1_score'] = float(f1_score(y_test_classes, y_pred_classes, average='weighted', zero_division=0))
                
                # Calculate confusion matrix for classification
                conf_matrix = confusion_matrix(y_test_classes, y_pred_classes)
                formatted_conf_matrix = {
                    'matrix': conf_matrix.tolist(),
                    'labels': [str(i) for i in range(conf_matrix.shape[0])]
                }
            except Exception as e:
                logger.error(f"Error calculating classification metrics: {str(e)}")
                # If classification metrics fail, fall back to regression metrics
                is_classification_task = False
                formatted_conf_matrix = None
        else:
            formatted_conf_matrix = None
        
        # Always calculate regression metrics (useful even for classification)
        if not is_classification_task or metrics_config.mse or metrics_config.rmse or metrics_config.mae or metrics_config.r2:
            # Make sure inputs are numeric for regression metrics
            y_test_numeric = y_test.astype(float) if isinstance(y_test, np.ndarray) else float(y_test)
            y_pred_numeric = y_pred.astype(float) if isinstance(y_pred, np.ndarray) else float(y_pred)
            
            if metrics_config.mse:
                metrics['mse'] = float(mean_squared_error(y_test_numeric, y_pred_numeric))
            if metrics_config.rmse:
                mse = mean_squared_error(y_test_numeric, y_pred_numeric)
                metrics['rmse'] = float(np.sqrt(mse))
            if metrics_config.mae:
                metrics['mae'] = float(mean_absolute_error(y_test_numeric, y_pred_numeric))
            if metrics_config.r2:
                metrics['r2'] = float(r2_score(y_test_numeric, y_pred_numeric))
            
            # For regression tasks, no confusion matrix
            if not is_classification_task:
                formatted_conf_matrix = None
        
        # Calculate feature importance
        feature_importance = calculate_feature_importance(model, X, feature_names)
        
        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        # Create evaluation record (using a temp user ID for development)
        evaluation = EvaluationModel(
        model_id=model_id,
        dataset_id=evaluation_in.dataset_id,
        metrics=metrics,
        parameters=evaluation_in.parameters.dict(),
        owner_id=current_user.id if current_user else 1,  # Use authenticated user or fallback
        accuracy=metrics.get('accuracy'),
        precision=metrics.get('precision'),
        recall=metrics.get('recall'),
        f1_score=metrics.get('f1_score'),
        confusion_matrix=formatted_conf_matrix,  # This line uses your formatted matrix
        feature_importance=feature_importance,
        execution_time=execution_time,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        return evaluation

    except Exception as e:
        db.rollback()
        logger.error(f"Error during evaluation: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error during evaluation: {str(e)}"
        )
        
@router.get("/{evaluation_id}", response_model=Evaluation)
def get_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    # Temporarily removed authentication: current_user: Any = Depends(get_current_user)
) -> Any:
    """Get evaluation results by ID."""
    evaluation = db.query(EvaluationModel).filter(
        EvaluationModel.id == evaluation_id
        # Temporarily removed: EvaluationModel.owner_id == current_user.id
    ).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=404,
            detail="Evaluation not found"
        )
        
    return evaluation

@router.get("/list")
def list_evaluations(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> Any:
    """List all evaluations."""
    evaluations = db.query(EvaluationModel).order_by(
        EvaluationModel.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for evaluation in evaluations:
        # Convert to dictionary
        eval_dict = evaluation.__dict__.copy()
        if '_sa_instance_state' in eval_dict:
            del eval_dict['_sa_instance_state']
        
        # Convert confusion matrix to dictionary format if it's a list
        if eval_dict.get('confusion_matrix') and isinstance(eval_dict['confusion_matrix'], list):
            eval_dict['confusion_matrix'] = {
                'matrix': eval_dict['confusion_matrix'],
                'labels': [str(i) for i in range(len(eval_dict['confusion_matrix']))]
            }
        
        result.append(eval_dict)
    
    return result