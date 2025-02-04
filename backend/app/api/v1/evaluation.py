from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.evaluation import EvaluationCreate, Evaluation
from app.services.ml.evaluation import MetricsCalculator, ModelAnalyzer
from app.models.evaluation import Evaluation as EvaluationModel

router = APIRouter()

@router.post("/{model_id}/evaluate", response_model=Evaluation)
async def evaluate_model(
    model_id: int,
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    evaluation_in: EvaluationCreate
) -> Any:
    """
    Evaluate a model on a given dataset.
    """
    try:
        # Initialize analyzer and calculator
        analyzer = ModelAnalyzer()
        calculator = MetricsCalculator()
        
        # Create evaluation record
        evaluation = EvaluationModel(
            model_id=model_id,
            dataset_id=evaluation_in.dataset_id,
            metrics={},  # Will be updated after evaluation
            owner_id=current_user.id
        )
        
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        
        return evaluation
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error during evaluation: {str(e)}"
        )

@router.get("/{evaluation_id}", response_model=Evaluation)
def get_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Get evaluation results by ID.
    """
    evaluation = db.query(EvaluationModel).filter(
        EvaluationModel.id == evaluation_id,
        EvaluationModel.owner_id == current_user.id
    ).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=404,
            detail="Evaluation not found"
        )
    
    return evaluation