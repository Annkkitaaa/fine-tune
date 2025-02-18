// src/hooks/usePipelineUtils.ts
import { Pipeline, PipelineResults } from '@/lib/types/pipeline';

export function usePipelineUtils() {
  const formatProcessedData = (rows?: number) => {
    if (!rows) return '0 rows';
    if (rows >= 1000000) return `${(rows / 1000000).toFixed(1)}M rows`;
    if (rows >= 1000) return `${(rows / 1000).toFixed(1)}K rows`;
    return `${rows} rows`;
  };

  const transformCorrelationMatrix = (matrix: number[][]) => {
    return matrix.map((row, i) => ({
      name: `Feature ${i + 1}`,
      ...row.reduce((acc, val, j) => ({ 
        ...acc, 
        [`Feature ${j + 1}`]: val 
      }), {})
    }));
  };

  const transformFeatureImportance = (importance: Record<string, number>) => {
    return Object.entries(importance)
      .map(([feature, value]) => ({
        feature,
        importance: value
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return {
    formatProcessedData,
    transformCorrelationMatrix,
    transformFeatureImportance,
    getStatusColor,
    formatDuration,
  };
}