import numpy as np
from typing import Dict, Any, List, Optional, Callable
from scipy.stats import uniform, randint
import logging

logger = logging.getLogger(__name__)

class RandomSearch:
    def __init__(
        self,
        param_distributions: Dict[str, Any],
        n_iter: int,
        scoring_fn: Callable,
        n_jobs: int = -1,
        random_state: Optional[int] = None
    ):
        self.param_distributions = param_distributions
        self.n_iter = n_iter
        self.scoring_fn = scoring_fn
        self.n_jobs = n_jobs if n_jobs > 0 else None
        self.random_state = random_state
        self.best_params_ = None
        self.best_score_ = None
        self.cv_results_ = None

    def _sample_parameters(self) -> Dict[str, Any]:
        """
        Sample parameters from distributions
        """
        params = {}
        for param_name, distribution in self.param_distributions.items():
            if isinstance(distribution, (list, tuple)):
                params[param_name] = np.random.choice(distribution)
            elif isinstance(distribution, uniform):
                params[param_name] = distribution.rvs()
            elif isinstance(distribution, randint):
                params[param_name] = distribution.rvs()
            else:
                raise ValueError(f"Unsupported distribution type for {param_name}")
        return params

    async def search(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Perform random search over parameter space
        """
        try:
            if self.random_state is not None:
                np.random.seed(self.random_state)
            
            results = []
            
            # Perform random search iterations
            with ThreadPoolExecutor(max_workers=self.n_jobs) as executor:
                futures = []
                
                for _ in range(self.n_iter):
                    params = self._sample_parameters()
                    futures.append(
                        executor.submit(
                            self._evaluate_params,
                            params,
                            X_train,
                            y_train,
                            X_val,
                            y_val
                        )
                    )
                
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
            logger.error(f"Error during random search: {str(e)}")
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
