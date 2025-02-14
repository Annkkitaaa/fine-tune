from typing import Dict, List, Optional, Union, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging
from pathlib import Path
import random
from scipy.interpolate import interp1d
import tensorflow as tf
import torch
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class DataAugmenter:
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self._augmentation_stats = {}
        
    async def augment_dataset(
        self,
        data: Union[pd.DataFrame, np.ndarray],
        method: str,
        augmentation_factor: float = 0.5,
        feature_names: Optional[List[str]] = None,
        target_column: Optional[str] = None
    ) -> Tuple[Union[pd.DataFrame, np.ndarray], Dict[str, Any]]:
        """
        Augment dataset using specified method
        """
        try:
            # Convert to DataFrame if numpy array
            if isinstance(data, np.ndarray):
                data = pd.DataFrame(
                    data,
                    columns=feature_names if feature_names else [f'feature_{i}' for i in range(data.shape[1])]
                )
            
            # Select augmentation method
            if method == "smote":
                augmented_data = await self._apply_smote(data, target_column, augmentation_factor)
            elif method == "mixup":
                augmented_data = await self._apply_mixup(data, augmentation_factor)
            elif method == "random_interpolation":
                augmented_data = await self._apply_random_interpolation(data, augmentation_factor)
            elif method == "gaussian_noise":
                augmented_data = await self._apply_gaussian_noise(data, augmentation_factor)
            elif method == "time_warp":
                augmented_data = await self._apply_time_warping(data, augmentation_factor)
            else:
                raise ValueError(f"Unsupported augmentation method: {method}")
            
            # Calculate augmentation statistics
            stats = await self._calculate_augmentation_stats(
                original_data=data,
                augmented_data=augmented_data,
                method=method
            )
            
            self._augmentation_stats = stats
            return augmented_data, stats
            
        except Exception as e:
            logger.error(f"Error in data augmentation: {str(e)}")
            raise

    async def _apply_mixup(
        self,
        df: pd.DataFrame,
        augmentation_factor: float
    ) -> pd.DataFrame:
        """Apply Mixup augmentation"""
        n_samples = int(len(df) * augmentation_factor)
        
        # Generate random pairs of indices
        idx1 = np.random.randint(0, len(df), n_samples)
        idx2 = np.random.randint(0, len(df), n_samples)
        
        # Generate random weights
        weights = np.random.beta(0.4, 0.4, n_samples)
        
        # Create new samples
        new_samples = []
        for i in range(n_samples):
            sample1 = df.iloc[idx1[i]].values
            sample2 = df.iloc[idx2[i]].values
            new_sample = weights[i] * sample1 + (1 - weights[i]) * sample2
            new_samples.append(new_sample)
        
        # Create augmented dataset
        augmented_samples = pd.DataFrame(new_samples, columns=df.columns)
        return pd.concat([df, augmented_samples], ignore_index=True)

    async def _apply_random_interpolation(
        self,
        df: pd.DataFrame,
        augmentation_factor: float
    ) -> pd.DataFrame:
        """Apply random interpolation augmentation"""
        n_samples = int(len(df) * augmentation_factor)
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        # Generate random pairs for interpolation
        idx1 = np.random.randint(0, len(df), n_samples)
        idx2 = np.random.randint(0, len(df), n_samples)
        alphas = np.random.uniform(0, 1, n_samples)
        
        new_samples = []
        for i in range(n_samples):
            sample = df.copy().iloc[idx1[i]]
            for col in numerical_cols:
                val1 = df.iloc[idx1[i]][col]
                val2 = df.iloc[idx2[i]][col]
                sample[col] = val1 + alphas[i] * (val2 - val1)
            new_samples.append(sample)
        
        augmented_samples = pd.DataFrame(new_samples)
        return pd.concat([df, augmented_samples], ignore_index=True)

    async def _apply_gaussian_noise(
        self,
        df: pd.DataFrame,
        augmentation_factor: float
    ) -> pd.DataFrame:
        """Apply Gaussian noise augmentation"""
        n_samples = int(len(df) * augmentation_factor)
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        # Generate noisy samples
        new_samples = []
        for _ in range(n_samples):
            sample = df.sample(n=1).copy()
            for col in numerical_cols:
                noise = np.random.normal(0, df[col].std() * 0.1)
                sample[col] += noise
            new_samples.append(sample)
        
        augmented_samples = pd.concat(new_samples)
        return pd.concat([df, augmented_samples], ignore_index=True)

    async def _apply_time_warping(
        self,
        df: pd.DataFrame,
        augmentation_factor: float
    ) -> pd.DataFrame:
        """Apply time warping augmentation for time series data"""
        if not any(pd.api.types.is_datetime64_any_dtype(df[col]) for col in df.columns):
            raise ValueError("No datetime column found for time warping")
        
        n_samples = int(len(df) * augmentation_factor)
        time_col = df.select_dtypes(include=['datetime64']).columns[0]
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        new_samples = []
        for _ in range(n_samples):
            # Create warped time points
            time_points = np.arange(len(df))
            warped_points = time_points + np.random.normal(0, 2, len(time_points))
            warped_points = np.sort(warped_points)
            
            # Interpolate values
            sample = df.copy()
            for col in numerical_cols:
                interpolator = interp1d(time_points, df[col], kind='cubic', bounds_error=False)
                sample[col] = interpolator(warped_points)
            
            new_samples.append(sample)
        
        augmented_samples = pd.concat(new_samples)
        return pd.concat([df, augmented_samples], ignore_index=True)

    async def _calculate_augmentation_stats(
        self,
        original_data: pd.DataFrame,
        augmented_data: pd.DataFrame,
        method: str
    ) -> Dict[str, Any]:
        """Calculate statistics about the augmentation process"""
        stats = {
            'method': method,
            'original_samples': len(original_data),
            'augmented_samples': len(augmented_data),
            'augmentation_ratio': len(augmented_data) / len(original_data),
            'feature_stats': {}
        }
        
        numerical_cols = original_data.select_dtypes(include=['int64', 'float64']).columns
        
        for col in numerical_cols:
            original_stats = {
                'mean': float(original_data[col].mean()),
                'std': float(original_data[col].std()),
                'min': float(original_data[col].min()),
                'max': float(original_data[col].max())
            }
            
            augmented_stats = {
                'mean': float(augmented_data[col].mean()),
                'std': float(augmented_data[col].std()),
                'min': float(augmented_data[col].min()),
                'max': float(augmented_data[col].max())
            }
            
            stats['feature_stats'][col] = {
                'original': original_stats,
                'augmented': augmented_stats,
                'distribution_shift': {
                    'mean_diff': augmented_stats['mean'] - original_stats['mean'],
                    'std_diff': augmented_stats['std'] - original_stats['std'],
                    'range_expansion': (
                        (augmented_stats['max'] - augmented_stats['min']) /
                        (original_stats['max'] - original_stats['min'])
                    )
                }
            }
        
        return stats

    def get_augmentation_stats(self) -> Dict[str, Any]:
        """Get statistics from the last augmentation operation"""
        return self._augmentation_stats

    async def validate_augmentation(
        self,
        original_data: pd.DataFrame,
        augmented_data: pd.DataFrame,
        threshold: float = 0.1
    ) -> Dict[str, bool]:
        """Validate augmentation results"""
        validation_results = {
            'distribution_preserved': True,
            'range_preserved': True,
            'correlation_preserved': True
        }
        
        numerical_cols = original_data.select_dtypes(include=['int64', 'float64']).columns
        
        # Check distribution preservation
        for col in numerical_cols:
            original_mean = original_data[col].mean()
            augmented_mean = augmented_data[col].mean()
            mean_diff = abs(original_mean - augmented_mean) / original_mean
            
            if mean_diff > threshold:
                validation_results['distribution_preserved'] = False
                break
        
        # Check range preservation
        for col in numerical_cols:
            original_range = original_data[col].max() - original_data[col].min()
            augmented_range = augmented_data[col].max() - augmented_data[col].min()
            range_diff = abs(original_range - augmented_range) / original_range
            
            if range_diff > threshold:
                validation_results['range_preserved'] = False
                break
        
        # Check correlation preservation
        original_corr = original_data[numerical_cols].corr()
        augmented_corr = augmented_data[numerical_cols].corr()
        corr_diff = np.abs(original_corr - augmented_corr).max()
        
        if corr_diff > threshold:
            validation_results['correlation_preserved'] = False
        
        return validation_results