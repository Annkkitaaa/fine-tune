// src/hooks/usePipeline.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Pipeline, 
  PipelineFormState 
} from '@/lib/types/pipeline';
import { pipelineService } from '@/lib/services/pipeline';
import { DEFAULT_PIPELINE_FORM } from '@/lib/constants/pipeline';

export function usePipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineForm, setPipelineForm] = useState<PipelineFormState>(DEFAULT_PIPELINE_FORM);
  
  // Track if we've done the initial fetch
  const initialFetchDone = useRef(false);
  // Track if polling is already set up
  const pollingSetUp = useRef(false);
  
  const fetchPipelines = useCallback(async (force = false) => {
    // If already loading and not forced, don't start another fetch
    if (loading && !force) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await pipelineService.listPipelines();
      setPipelines(response || []);
    } catch (err) {
      console.error("Error fetching pipelines:", err);
      
      if (err instanceof Error && 
         (err.message.includes('timeout') || err.message.includes('busy'))) {
        setPipelines([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch pipelines');
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const createPipeline = useCallback(async () => {
    try {
      if (!pipelineForm.datasetId) {
        setError('Please select a dataset');
        return null;
      }

      setIsSubmitting(true);
      setError(null);
      
      const response = await pipelineService.createPipeline(pipelineForm);
      
      setPipelines(prev => [response, ...prev]);
      return response;
    } catch (err) {
      console.error("Error creating pipeline:", err);
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [pipelineForm]);

  const rerunPipeline = useCallback(async (pipelineId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await pipelineService.rerunPipeline(pipelineId);
      
      setPipelines(prev => prev.map(pipeline => 
        pipeline.pipeline_id === pipelineId ? response : pipeline
      ));
      
      return response;
    } catch (err) {
      console.error("Error rerunning pipeline:", err);
      setError(err instanceof Error ? err.message : 'Failed to rerun pipeline');
      throw err;
    } finally {
      setIsSubmitting(false);
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

  // Initial data fetch - runs only once
  useEffect(() => {
    // Only fetch if we haven't already done so
    if (!initialFetchDone.current) {
      fetchPipelines(true);
      initialFetchDone.current = true;
    }
  }, [fetchPipelines]);

  // This completely disables the polling for now to fix the issue
  // You can reenable this when you've fixed the other issues
  /*
  useEffect(() => {
    // Only set up polling once
    if (!pollingSetUp.current) {
      pollingSetUp.current = true;
      
      const pollInterval = setInterval(() => {
        if (pipelines.some(p => p.status === 'running' || p.status === 'pending')) {
          fetchPipelines(true);
        }
      }, 30000); // Poll every 30 seconds, reduced frequency
      
      return () => clearInterval(pollInterval);
    }
  }, [fetchPipelines, pipelines]);
  */

  return {
    pipelines,
    pipelineForm,
    loading,
    isSubmitting,
    error,
    createPipeline,
    rerunPipeline,
    updatePipelineForm,
    resetPipelineForm,
    refreshPipelines: fetchPipelines,
  };
}