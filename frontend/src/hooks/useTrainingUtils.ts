
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateProgress = (training: Training) => {
    if (training.status === 'completed') return 100;
    if (!training.metrics) return 0;
    
    const currentEpoch = training.metrics.epochs_completed || 0;
    const totalEpochs = training.hyperparameters.epochs;
    return Math.round((currentEpoch / totalEpochs) * 100);
  };

  const formatMetric = (value: number) => {
    return value.toFixed(4);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTimeRemaining = (training: Training) => {
    if (training.status !== 'running' || !training.metrics) return null;
    
    const elapsed = training.metrics.training_time || 0;
    const progress = calculateProgress(training);
    if (progress === 0) return null;
    
    const totalEstimated = (elapsed * 100) / progress;
    return formatDuration(totalEstimated - elapsed);
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