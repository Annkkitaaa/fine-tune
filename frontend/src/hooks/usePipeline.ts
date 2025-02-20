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

