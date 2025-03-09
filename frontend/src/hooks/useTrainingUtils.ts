// src/hooks/useTrainingUtils.ts
import { Training, TrainingState } from '@/lib/types/training';

export function useTrainingUtils() {
  const getStatusColor = (status: TrainingState) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'queued':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateProgress = (training: Training) => {
    if (!training) return 0;
    if (training.status === 'completed') return 100;
    
    // Use safe navigation
    const metrics = training.metrics;
    const hyperparameters = training.hyperparameters;
    
    if (!metrics || !hyperparameters) return 0;
    
    const currentEpoch = metrics.epochs_completed ?? 0;
    const totalEpochs = hyperparameters.epochs ?? 1; // Prevent division by zero
    
    return Math.min(100, Math.round((currentEpoch / totalEpochs) * 100));
  };

  const formatMetric = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(4);
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTimeRemaining = (training: Training) => {
    if (!training) return null;
    if (training.status !== 'running') return null;
    
    const metrics = training.metrics;
    if (!metrics) return null;
    
    const elapsed = metrics.training_time ?? 0;
    const progress = calculateProgress(training);
    
    if (progress <= 0) return null; // Prevent division by zero
    
    const totalEstimated = (elapsed * 100) / progress;
    return formatDuration(Math.max(0, totalEstimated - elapsed));
  };

  return {
    getStatusColor,
    formatDuration,
    calculateProgress,
    formatMetric,
    formatPercentage,
    getTimeRemaining,
  };
}