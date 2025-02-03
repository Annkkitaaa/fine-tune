from bayes_opt import BayesianOptimization
from typing import Dict, Any, List, Optional, Callable
import numpy as np
import logging

logger = logging.getLogger(__name__)

class BayesianOptimizer:
    def __init__(
        self,
        param_bounds: Dict[str, tuple],
        scoring_fn: Callable,
        n_iter: int,
        random_state: Optional[int] = None
    ):
        self.param_bounds = param_bounds
        self.scoring_fn = scoring_fn
        self.n_iter = n_iter
        self.random_state = random_state
        self.optimizer = None
        self.best_params_ = None
        self.best_score_ = None

    def _objective_function(self, **params) -> float:
        """
        Objective function for Bayesian optimization
        """
        try:
            return self.scoring_fn(params)
        except Exception as e:
            logger.error(f"Error in objective function: {str(e)}")
            return float('-inf')

    async def optimize(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        init_points: int = 5
    ) -> Dict[str, Any]:
        """
        Perform Bayesian optimization
        """
        try:
            self.optimizer = BayesianOptimization(
                f=self._objective_function,
                pbounds=self.param_bounds,
                random_state=self.random_state
            )
            
            # Perform optimization
            self.optimizer.maximize(
                init_points=init_points,
                n_iter=self.n_iter
            )
            
            # Extract results
            self.best_params_ = self.optimizer.max['params']
            self.best_score_ = self.optimizer.max['target']
            
            return {
                'best_params': self.best_params_,
                'best_score': self.best_score_,
                'all_results': self.optimizer.res
            }
            
        except Exception as e:
            logger.error(f"Error during Bayesian optimization: {str(e)}")
            raise