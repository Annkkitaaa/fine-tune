// src/hooks/useTraining.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  Training,
  TrainingFormState,
  TrainingCreateRequest,
  DEFAULT_TRAINING_FORM
} from '@/lib/types/training';
import { trainingService } from '@/lib/services/training';

// Key to store training IDs in localStorage
const TRAINING_IDS_KEY = 'ml_platform_training_ids';

export function useTraining() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(DEFAULT_TRAINING_FORM);

  // Function to get all training IDs from localStorage
  const getTrainingIds = useCallback((): number[] => {
    try {
      const idsStr = localStorage.getItem(TRAINING_IDS_KEY);
      if (!idsStr) return [];
      
      const parsedIds = JSON.parse(idsStr);
      return Array.isArray(parsedIds) ? parsedIds : [];
    } catch (err) {
      console.error('Failed to get training IDs:', err);
      return [];
    }
  }, []);

  // Function to save a new training ID to localStorage
  const saveTrainingId = useCallback((training: Training) => {
    try {
      if (!training || !training.id) return;
      
      const existingIds = getTrainingIds();
      if (!existingIds.includes(training.id)) {
        const updatedIds = [...existingIds, training.id];
        localStorage.setItem(TRAINING_IDS_KEY, JSON.stringify(updatedIds));
        console.log("Training ID saved to localStorage:", training.id);
      }
    } catch (err) {
      console.error('Failed to save training ID:', err);
    }
  }, [getTrainingIds]);

  // Fetch all trainings - directly using service that handles localStorage
  const fetchTrainings = useCallback(async () => {
    console.log("Fetching trainings...");
    try {
      setLoading(true);
      setError(null);
      
      const response = await trainingService.listTrainings();
      console.log("Trainings retrieved:", response);
      
      setTrainings(response || []);
    } catch (err) {
      console.error("Error fetching trainings:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start a new training job with better error handling
  const startTraining = useCallback(async () => {
    console.log("Starting training with form:", trainingForm);
    try {
      setLoading(true);
      setError(null);
      
      // Check if form has required values
      if (!trainingForm.modelId || !trainingForm.datasetId) {
        throw new Error('Model and dataset are required');
      }
      
      // Create request payload
      const request: TrainingCreateRequest = {
        model_id: parseInt(trainingForm.modelId),
        dataset_id: parseInt(trainingForm.datasetId),
        hyperparameters: trainingForm.hyperparameters
      };

      console.log("Sending request to API:", request);
      
      // Make direct request to ensure it works
      try {
        const response = await trainingService.startTraining(request);
        console.log("Training started successfully:", response);
        
        // Save training ID and update list
        if (response) {
          saveTrainingId(response);
          setTrainings(prev => [response, ...prev]);
        }
        
        return response;
      } catch (apiError) {
        console.error("API error starting training:", apiError);
        throw new Error(apiError instanceof Error ? apiError.message : 'API error starting training');
      }
    } catch (err) {
      console.error("Error in startTraining:", err);
      const message = err instanceof Error ? err.message : 'Failed to start training';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [trainingForm, saveTrainingId]);

  // Stop a training job
  const stopTraining = useCallback(async (trainingId: number) => {
    console.log(`Stopping training: ${trainingId}`);
    try {
      setLoading(true);
      setError(null);
      
      const response = await trainingService.stopTraining(trainingId);
      
      // Update the stopped training in the list
      setTrainings(prev => prev.map(training => 
        training.id === trainingId ? response : training
      ));
      
      return response;
    } catch (err) {
      console.error("Error in stopTraining:", err);
      const message = err instanceof Error ? err.message : 'Failed to stop training';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Form update handlers
  const updateTrainingForm = useCallback((updates: Partial<TrainingFormState>) => {
    console.log("Updating training form:", updates);
    setTrainingForm(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetTrainingForm = useCallback(() => {
    console.log("Resetting training form");
    setTrainingForm(DEFAULT_TRAINING_FORM);
  }, []);

  // Direct API call for emergency use
  const directStartTraining = useCallback(async () => {
    console.log("Emergency direct training start");
    try {
      setLoading(true);
      
      // Create request payload
      const payload = {
        model_id: parseInt(trainingForm.modelId),
        dataset_id: parseInt(trainingForm.datasetId),
        hyperparameters: trainingForm.hyperparameters
      };
      
      // Get auth token if used
      const token = localStorage.getItem('access_token');
      
      // Make direct fetch call
      const response = await fetch('http://localhost:8000/api/v1/training/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      console.log("Direct API response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Direct API response data:", data);
      
      // Update state with new training
      if (data && data.id) {
        saveTrainingId(data);
        setTrainings(prev => [data, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error("Error in directStartTraining:", err);
      setError(err instanceof Error ? err.message : 'Direct API call failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trainingForm, saveTrainingId]);

  // Load trainings on mount
  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);
  
  // Poll for updates on active trainings
  useEffect(() => {
    const hasActiveTrainings = trainings.some(t => 
      t.status === 'running' || t.status === 'queued'
    );
    
    if (!hasActiveTrainings) return;
    
    const interval = setInterval(() => {
      console.log("Polling for training updates");
      fetchTrainings();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [trainings, fetchTrainings]);

  return {
    trainings,
    trainingForm,
    loading,
    error,
    startTraining,
    directStartTraining, // Add the emergency direct method
    stopTraining,
    updateTrainingForm,
    resetTrainingForm,
    refreshTrainings: fetchTrainings,
  };
}