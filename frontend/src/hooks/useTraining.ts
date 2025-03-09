// src/hooks/useTraining.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  Training,
  TrainingFormState,
  TrainingCreateRequest
} from '@/lib/types/training';
import { trainingService } from '@/lib/services/training';
import { DEFAULT_TRAINING_FORM } from '@/lib/constants/training';

// Key to store training IDs in localStorage
const TRAINING_IDS_KEY = 'ml_platform_training_ids';

export function useTraining() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(DEFAULT_TRAINING_FORM);

  // Function to save training ID to localStorage
  const saveTrainingId = useCallback((training: Training) => {
    try {
      const existingIdsStr = localStorage.getItem(TRAINING_IDS_KEY);
      let existingIds: number[] = [];
      
      if (existingIdsStr) {
        try {
          existingIds = JSON.parse(existingIdsStr);
        } catch (e) {
          console.error("Error parsing training IDs:", e);
        }
      }
      
      if (!existingIds.includes(training.id)) {
        existingIds.push(training.id);
        localStorage.setItem(TRAINING_IDS_KEY, JSON.stringify(existingIds));
      }
    } catch (err) {
      console.error('Failed to save training ID:', err);
    }
  }, []);

  // Function to get all training IDs from localStorage
  const getTrainingIds = useCallback((): number[] => {
    try {
      const idsStr = localStorage.getItem(TRAINING_IDS_KEY);
      if (!idsStr) return [];
      return JSON.parse(idsStr);
    } catch (err) {
      console.error('Failed to get training IDs:', err);
      return [];
    }
  }, []);

  // Fetch all trainings by their IDs
  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const trainingIds = getTrainingIds();
      if (trainingIds.length === 0) {
        setTrainings([]);
        return;
      }
      
      // Fetch each training job status individually
      const fetchPromises = trainingIds.map((id) => 
        trainingService.getTrainingStatus(id)
          .catch(err => {
            console.error(`Error fetching training ${id}:`, err);
            return null; // Return null for failed fetches
          })
      );
      
      const results = await Promise.all(fetchPromises);
      
      // Filter out null results (failed fetches) and set trainings
      const validTrainings: Training[] = [];
      for (const result of results) {
        if (result !== null) {
          validTrainings.push(result);
        }
      }
      setTrainings(validTrainings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  }, [getTrainingIds]);

  // Start a new training job
  const startTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting training with form:", trainingForm);
      
      const request: TrainingCreateRequest = {
        model_id: parseInt(trainingForm.modelId, 10),
        dataset_id: parseInt(trainingForm.datasetId, 10),
        hyperparameters: trainingForm.hyperparameters
      };

      console.log("Sending request to API:", request);
      
      const response = await trainingService.startTraining(request);
      console.log("Training started successfully:", response);
      
      // Save the new training ID to localStorage for future retrieval
      if (response) {
        saveTrainingId(response);
        // Add the new training to the current state
        setTrainings(prev => [response, ...prev]);
      }
      
      return response;
    } catch (err) {
      console.error("Training start error:", err);
      const message = err instanceof Error ? err.message : 'Failed to start training';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [trainingForm, saveTrainingId]);

  // Stop a running training job (or logical stop if API doesn't support it)
  const stopTraining = useCallback(async (trainingId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if there's a stopTraining method in the service
      if (typeof trainingService.stopTraining === 'function') {
        // If the API supports stopping training, use that
        const response = await trainingService.stopTraining(trainingId);
        setTrainings(prev => prev.map(training => 
          training.id === trainingId ? response : training
        ));
        return response;
      } else {
        // Otherwise implement a logical stop by just updating the UI
        console.log("No stopTraining API available, implementing logical stop");
        
        // First, update the UI immediately for better user experience
        setTrainings(prev => prev.map(training => 
          training.id === trainingId 
            ? { ...training, status: 'stopped' as const } 
            : training
        ));
        
        // Then fetch the latest status to ensure it's up-to-date
        const updatedTraining = await trainingService.getTrainingStatus(trainingId);
        
        // Update with the real status from the server
        setTrainings(prev => prev.map(training => 
          training.id === trainingId ? updatedTraining : training
        ));
        
        return updatedTraining;
      }
    } catch (err) {
      console.error("Error stopping training:", err);
      const message = err instanceof Error ? err.message : 'Failed to stop training';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Form update functions
  const updateTrainingForm = useCallback((updates: Partial<TrainingFormState>) => {
    setTrainingForm(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetTrainingForm = useCallback(() => {
    setTrainingForm(DEFAULT_TRAINING_FORM);
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);
  
  // Setup polling for active trainings
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if there are running jobs
      const hasRunningJobs = trainings.some(t => 
        t.status === 'running' || t.status === 'queued'
      );
      if (hasRunningJobs) {
        fetchTrainings();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [trainings, fetchTrainings]);

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