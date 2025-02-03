# grid_search.py
from typing import Dict, Any, List, Optional, Callable
import itertools
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class GridSearch:
    def __init__(
        self,
        param_grid: Dict[str, List[Any]],
        scoring_fn: Callable,
        n_jobs: int = -1
    ):
        self.param_grid = param_grid
        self.scoring_fn = scoring_fn
        self.n_jobs = n_jobs if n_jobs > 0 else None
        self.best_params_ = None
        self.best_score_ = None
        self.cv_results_ = None

    async def search(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Perform grid search over parameter grid
        """
        try:
            # Generate all parameter combinations
            param_combinations = [
                dict(zip(self.param_grid.keys(), v))
                for v in itertools.product(*self.param_grid.values())
            ]
            
            results = []
            
            # Parallel execution of parameter combinations
            with ThreadPoolExecutor(max_workers=self.n_jobs) as executor:
                futures = [
                    executor.submit(
                        self._evaluate_params,
                        params,
                        X_train,
                        y_train,
                        X_val,
                        y_val
                    )
                    for params in param_combinations
                ]
                
                for future in futures:
                    results.append(future.result())
            
            # Process results
            self.cv_results_ = results
            best_idx = np.argmax([r['score'] for r in results])
            self.best_params_ = results[best_idx]['params']
            self.best_score_ = results[best_idx]['score']
            
            return {
                'best_params': self.best_params_,
                'best_score': self.best_score_,
                'cv_results': self.cv_results_
            }
            
        except Exception as e:
            logger.error(f"Error during grid search: {str(e)}")
            raise

    def _evaluate_params(
        self,
        params: Dict[str, Any],
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray],
        y_val: Optional[np.ndarray]
    ) -> Dict[str, Any]:
        """
        Evaluate a single parameter combination
        """
        try:
            score = self.scoring_fn(params, X_train, y_train, X_val, y_val)
            return {
                'params': params,
                'score': score
            }
        except Exception as e:
            logger.error(f"Error evaluating parameters {params}: {str(e)}")
            return {
                'params': params,
                'score': float('-inf')
            }