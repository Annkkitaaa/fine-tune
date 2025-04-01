// src/hooks/useTrainingUtils.ts
import { Training } from '@/types/training.types';

export function useTrainingUtils() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
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
    
    // Use epochs_completed from training record if available
    if (training.epochs_completed !== undefined && training.epochs_total !== undefined) {
      return Math.min(100, Math.round((training.epochs_completed / training.epochs_total) * 100));
    }
    
    // Fallback to metrics
    const metrics = training.metrics;
    const hyperparameters = training.hyperparameters;
    
    if (!metrics || !hyperparameters) return 0;
    
    const currentEpoch = training.epochs_completed ?? 0;
    const totalEpochs = training.epochs_total ?? hyperparameters.epochs ?? 1; // Prevent division by zero
    
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
    
    if (!training.start_time) return null;
    
    const startTime = new Date(training.start_time).getTime();
    const currentTime = new Date().getTime();
    const elapsedMs = currentTime - startTime;
    const elapsedSeconds = elapsedMs / 1000;
    
    const progress = calculateProgress(training);
    
    if (progress <= 0) return null; // Prevent division by zero
    
    const totalEstimatedSeconds = (elapsedSeconds * 100) / progress;
    return formatDuration(Math.max(0, totalEstimatedSeconds - elapsedSeconds));
  };

  const getEstimatedCompletionTime = (training: Training) => {
    if (!training.start_time || !training.epochs_completed || 
        !training.epochs_total) {
      return 'Unknown';
    }
    
    const startTime = new Date(training.start_time).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - startTime;
    const epochsRemaining = training.epochs_total - training.epochs_completed;
    
    if (epochsRemaining <= 0 || training.epochs_completed === 0) {
      return 'Calculating...';
    }
    
    const timePerEpoch = elapsedTime / training.epochs_completed;
    const remainingTime = timePerEpoch * epochsRemaining;
    const completionTime = new Date(currentTime + remainingTime);
    
    return completionTime.toLocaleTimeString();
  };

  // Convert any epoch-based history data to a chart-friendly format
  const prepareHistoryChartData = (training: Training) => {
    if (!training?.metrics?.history) return [];
    
    const history = training.metrics.history;
    const data = [];
    
    // Find the longest array to determine number of epochs
    let maxEpochs = 0;
    for (const key in history) {
      if (Array.isArray(history[key])) {
        maxEpochs = Math.max(maxEpochs, history[key].length);
      }
    }
    
    // Create data points for each epoch
    for (let i = 0; i < maxEpochs; i++) {
      const point: any = { epoch: i + 1 };
      
      for (const key in history) {
        if (Array.isArray(history[key]) && i < history[key].length) {
          point[key] = history[key][i];
        }
      }
      
      data.push(point);
    }
    
    return data;
  };

  return {
    getStatusColor,
    formatDuration,
    calculateProgress,
    formatMetric,
    formatPercentage,
    getTimeRemaining,
    getEstimatedCompletionTime,
    prepareHistoryChartData
  };
}