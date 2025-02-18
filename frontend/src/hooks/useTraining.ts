// src/hooks/useTraining.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  Training,
  TrainingFormState,
  TrainingCreateRequest
} from '@/lib/types/training';
import { trainingService } from '@/lib/services/training';
import { DEFAULT_TRAINING_FORM } from '@/lib/constants/training';

export function useTraining() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(DEFAULT_TRAINING_FORM);

  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainingService.listTrainings();
      setTrainings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  }, []);

  const startTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const request: TrainingCreateRequest = {
        model_id: parseInt(trainingForm.modelId),
        dataset_id: parseInt(trainingForm.datasetId),
        hyperparameters: trainingForm.hyperparameters
      };

      const response = await trainingService.startTraining(request);
      setTrainings(prev => [response, ...prev]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trainingForm]);

  const stopTraining = useCallback(async (trainingId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainingService.stopTraining(trainingId);
      setTrainings(prev => prev.map(training => 
        training.id === trainingId ? response : training
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop training');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTrainingForm = useCallback((updates: Partial<TrainingFormState>) => {
    setTrainingForm(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetTrainingForm = useCallback(() => {
    setTrainingForm(DEFAULT_TRAINING_FORM);
  }, []);

  // Setup polling for active trainings
  useEffect(() => {
    fetchTrainings();
    const interval = setInterval(fetchTrainings, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchTrainings]);

  return {
    trainings,
    trainingForm,
    loading,
    error,
    startTraining,
    stopTraining,
    updateTrainingForm,
    resetTrainingForm,
    refreshTrainings: fetchTrainings,
  };
}
