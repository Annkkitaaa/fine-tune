# augmentation.py
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Union
from sklearn.utils import resample
import logging

logger = logging.getLogger(__name__)

class DataAugmenter:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    async def augment_dataset(
        self,
        df: pd.DataFrame,
        method: str,
        target_column: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Augment dataset using specified method
        """
        try:
            if method == "smote":
                return self._apply_smote(df, target_column)
            elif method == "random_oversampling":
                return self._random_oversampling(df, target_column)
            elif method == "gaussian_noise":
                return self._add_gaussian_noise(df)
            else:
                raise ValueError(f"Unsupported augmentation method: {method}")
        except Exception as e:
            logger.error(f"Error augmenting dataset: {str(e)}")
            raise

    def _apply_smote(self, df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """
        Apply SMOTE for balanced sampling
        """
        try:
            from imblearn.over_sampling import SMOTE
            
            X = df.drop(target_column, axis=1)
            y = df[target_column]
            
            smote = SMOTE()
            X_resampled, y_resampled = smote.fit_resample(X, y)
            
            return pd.concat([pd.DataFrame(X_resampled, columns=X.columns),
                            pd.Series(y_resampled, name=target_column)], axis=1)
        except ImportError:
            logger.warning("SMOTE not available, falling back to random oversampling")
            return self._random_oversampling(df, target_column)

    def _random_oversampling(self, df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """
        Perform random oversampling for imbalanced datasets
        """
        if not target_column:
            raise ValueError("Target column required for oversampling")
        
        # Get class distributions
        class_counts = df[target_column].value_counts()
        majority_class = class_counts.index[0]
        majority_size = class_counts[majority_class]
        
        # Resample minority classes
        resampled_dfs = [df[df[target_column] == majority_class]]
        
        for cls in class_counts.index[1:]:
            minority_df = df[df[target_column] == cls]
            resampled_minority = resample(minority_df,
                                        replace=True,
                                        n_samples=majority_size,
                                        random_state=42)
            resampled_dfs.append(resampled_minority)
        
        return pd.concat(resampled_dfs)

    def _add_gaussian_noise(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add Gaussian noise to numerical columns
        """
        noise_factor = self.config.get('noise_factor', 0.05)
        numerical_columns = df.select_dtypes(include=['int64', 'float64']).columns
        
        df_noisy = df.copy()
        for column in numerical_columns:
            noise = np.random.normal(0, noise_factor * df[column].std(), size=len(df))
            df_noisy[column] = df[column] + noise
        
        return df_noisy