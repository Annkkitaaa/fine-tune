from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.evaluation import EvaluationCreate, Evaluation
from app.services.ml.evaluation.evaluator import evaluate_model
from app.models.evaluation import Evaluation as EvaluationModel

router = APIRouter()

@router.post("/evaluate", response_model=Evaluation)
async def evaluate(
    *,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    eval_in: EvaluationCreate
) -> Any:
    """
    Evaluate trained model.
    """
    # Run evaluation
    eval_results = await evaluate_model(
        model_id=eval_in.model_id,
        dataset_id=eval_in.dataset_id
    )
    
    # Create evaluation record
    evaluation = EvaluationModel(
        model_id=eval_in.model_id,
        dataset_id=eval_in.dataset_id,
        metrics=eval_results,
        owner_id=current_user.id
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation

@router.get("/list/{model_id}", response_model=List[Evaluation])
def list_evaluations(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    List model evaluations.
    """
    evaluations = db.query(EvaluationModel).filter(
        EvaluationModel.model_id == model_id,
        EvaluationModel.owner_id == current_user.id
    ).all()
    return evaluations