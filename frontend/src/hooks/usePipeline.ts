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
      console.log("Fetched pipelines:", response);
      setPipelines(response || []);
    } catch (err) {
      console.error("Error fetching pipelines:", err);
      
      // Handle different error types
      if (err instanceof Error && 
         (err.message.includes('timeout') || err.message.includes('busy'))) {
        console.log("Pipeline request timed out - using empty list");
        setPipelines([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch pipelines');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createPipeline = useCallback(async () => {
    try {
      if (!pipelineForm.datasetId) {
        setError('Please select a dataset');
        return null;
      }

      setLoading(true);
      setError(null);
      
      console.log("Creating pipeline with form:", pipelineForm);
      
      const response = await pipelineService.createPipeline(pipelineForm);
      console.log("Pipeline creation response:", response);
      
      setPipelines(prev => [response, ...prev]);
      return response;
    } catch (err) {
      console.error("Error creating pipeline:", err);
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
      
      console.log("Rerunning pipeline ID:", pipelineId);
      
      const response = await pipelineService.rerunPipeline(pipelineId);
      console.log("Pipeline rerun response:", response);
      
      setPipelines(prev => prev.map(pipeline => 
        pipeline.pipeline_id === pipelineId ? response : pipeline
      ));
      
      return response;
    } catch (err) {
      console.error("Error rerunning pipeline:", err);
      setError(err instanceof Error ? err.message : 'Failed to rerun pipeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePipelineForm = useCallback((updates: Partial<PipelineFormState>) => {
    console.log("Updating pipeline form with:", updates);
    setPipelineForm(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetPipelineForm = useCallback(() => {
    console.log("Resetting pipeline form to defaults");
    setPipelineForm(DEFAULT_PIPELINE_FORM);
  }, []);

  // Setup polling only for running pipelines
  useEffect(() => {
    fetchPipelines();
    
    const interval = setInterval(() => {
      // Only poll if there are running pipelines
      const hasRunningPipelines = pipelines.some(p => p.status === 'running' || p.status === 'pending');
      if (hasRunningPipelines) {
        console.log("Polling for pipeline updates");
        fetchPipelines();
      }
    }, 15000); // Reduced polling frequency to 15 seconds to avoid overwhelming the server
    
    return () => clearInterval(interval);
  }, [fetchPipelines, pipelines]);

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