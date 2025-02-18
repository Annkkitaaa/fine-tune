// src/hooks/usePipeline.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  Pipeline, 
  PipelineFormState 
} from '@/lib/types/pipeline';
import { pipelineService } from '@/lib/services/pipeline';
import { DEFAULT_PIPELINE_FORM } from '@/lib/constants/pipeline';

export function usePipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineForm, setPipelineForm] = useState<PipelineFormState>(DEFAULT_PIPELINE_FORM);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.listPipelines();
      setPipelines(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.createPipeline(pipelineForm);
      setPipelines(prev => [response, ...prev]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pipelineForm]);

  const rerunPipeline = useCallback(async (pipelineId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.rerunPipeline(pipelineId);
      setPipelines(prev => prev.map(pipeline => 
        pipeline.pipeline_id === pipelineId ? response : pipeline
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rerun pipeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePipelineForm = useCallback((updates: Partial<PipelineFormState>) => {
    setPipelineForm(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetPipelineForm = useCallback(() => {
    setPipelineForm(DEFAULT_PIPELINE_FORM);
  }, []);

  // Setup polling
  useEffect(() => {
    fetchPipelines();
    const interval = setInterval(fetchPipelines, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchPipelines]);

  return {
    pipelines,
    pipelineForm,
    loading,
    error,
    createPipeline,
    rerunPipeline,
    updatePipelineForm,
    resetPipelineForm,
    refreshPipelines: fetchPipelines,
  };
}

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