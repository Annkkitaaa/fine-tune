// src/hooks/useEvaluation.ts
import { useState, useCallback } from 'react';
import { 
  Evaluation, 
  EvaluationCreateRequest,
  EvaluationFormState 
} from '@/lib/types/evaluation';
import { evaluationService } from '@/lib/services/evaluation';
import { DEFAULT_EVALUATION_FORM } from '@/lib/constants/evaluation';

export function useEvaluation() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormState>(DEFAULT_EVALUATION_FORM);

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluationService.listEvaluations();
      setEvaluations(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluations');
    } finally {
      setLoading(false);
    }
  }, []);

  const startEvaluation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const modelId = parseInt(evaluationForm.modelId);
      const request: EvaluationCreateRequest = {
        dataset_id: parseInt(evaluationForm.datasetId),
        metrics: evaluationForm.metrics,
        parameters: evaluationForm.parameters
      };

      const response = await evaluationService.evaluateModel(modelId, request);
      setEvaluations(prev => [response, ...prev]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start evaluation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [evaluationForm]);

  const updateEvaluationForm = useCallback((updates: Partial<EvaluationFormState>) => {
    setEvaluationForm(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetEvaluationForm = useCallback(() => {
    setEvaluationForm(DEFAULT_EVALUATION_FORM);
  }, []);

  return {
    evaluations,
    evaluationForm,
    loading,
    error,
    fetchEvaluations,
    startEvaluation,
    updateEvaluationForm,
    resetEvaluationForm,
  };
}