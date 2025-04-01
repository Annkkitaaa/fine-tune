// src/hooks/useTraining.ts
import { useState, useCallback, useEffect } from 'react';
import {
  Training,
  TrainingCreateRequest,
  DEFAULT_TRAINING_FORM
} from "@/types/training.types";
import { trainingService } from "@/services/training.service";

const TRAINING_IDS_KEY = "ml_platform_training_ids";
const AUTO_REFRESH_INTERVAL = 5000; 
// Define training form type
interface TrainingForm {
  modelId: string;
  datasetId: string;
  hyperparameters: {
    learning_rate: number;
    batch_size: number;
    epochs: number;
    optimizer: {
      name: string;
    };
  };
}

export function useTraining() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrainingIds, setActiveTrainingIds] = useState<number[]>([]);
  
  // Initialize training form with default values
  const [trainingForm, setTrainingForm] = useState<TrainingForm>({
    modelId: '',
    datasetId: '',
    hyperparameters: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 10,
      optimizer: {
        name: 'adam'
      }
    }
  });

  // Load active training IDs from localStorage
  useEffect(() => {
    const savedIds = localStorage.getItem(TRAINING_IDS_KEY);
    if (savedIds) {
      try {
        const ids = JSON.parse(savedIds);
        if (Array.isArray(ids)) {
          setActiveTrainingIds(ids);
        }
      } catch {
        // Reset if corrupt
        localStorage.removeItem(TRAINING_IDS_KEY);
      }
    }
    
    // Initial fetch of trainings
    fetchTrainings();
  }, []);

  // Save active training IDs
  const saveActiveTrainingIds = useCallback((ids: number[]) => {
    setActiveTrainingIds(ids);
    localStorage.setItem(TRAINING_IDS_KEY, JSON.stringify(ids));
  }, []);

  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainingService.getTrainings();
      setTrainings(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Function to refresh trainings data
  const refreshTrainings = useCallback(() => {
    return fetchTrainings();
  }, [fetchTrainings]);

  // Update training form
  const updateTrainingForm = useCallback((updates: Partial<TrainingForm>) => {
    setTrainingForm(prev => {
      // Handle nested updates properly
      if (updates.hyperparameters) {
        return {
          ...prev,
          ...updates,
          hyperparameters: {
            ...prev.hyperparameters,
            ...updates.hyperparameters
          }
        };
      }
      return { ...prev, ...updates };
    });
  }, []);

  // Reset training form to defaults
  const resetTrainingForm = useCallback(() => {
    setTrainingForm({
      modelId: '',
      datasetId: '',
      hyperparameters: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 10,
        optimizer: {
          name: 'adam'
        }
      }
    });
  }, []);

  // Start training with form data
  const startTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert form data to API request format
      const requestData: TrainingCreateRequest = {
        model_id: parseInt(trainingForm.modelId),
        dataset_id: parseInt(trainingForm.datasetId),
        hyperparameters: trainingForm.hyperparameters
      };
      
      const response = await trainingService.createTraining(requestData);
      setTrainings(prev => [response, ...prev]);
      
      // Add to active trainings
      saveActiveTrainingIds([...activeTrainingIds, response.id]);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create training');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trainingForm, activeTrainingIds, saveActiveTrainingIds]);

  // Direct start method (for emergency button)
  const directStartTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use default values for direct start
      const requestData: TrainingCreateRequest = {
        model_id: parseInt(trainingForm.modelId),
        dataset_id: parseInt(trainingForm.datasetId),
        hyperparameters: {
          learning_rate: 0.01,
          batch_size: 16,
          epochs: 5,
          optimizer: {
            name: 'sgd'
          }
        }
      };
      
      const response = await trainingService.createTraining(requestData);
      setTrainings(prev => [response, ...prev]);
      
      // Add to active trainings
      saveActiveTrainingIds([...activeTrainingIds, response.id]);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create training');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trainingForm, activeTrainingIds, saveActiveTrainingIds]);

  const getTrainingById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainingService.getTrainingById(id);
      
      // Update the training in the list
      setTrainings(prev => 
        prev.map(t => t.id === id ? response : t)
      );
      
      return response;
    } catch (err: any) {
      setError(err.message || `Failed to fetch training #${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopTraining = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await trainingService.cancelTraining(id);
      
      // Update status in the list
      setTrainings(prev => 
        prev.map(t => t.id === id ? {...t, status: 'cancelled'} : t)
      );
      
      // Remove from active trainings
      saveActiveTrainingIds(activeTrainingIds.filter(tId => tId !== id));
    } catch (err: any) {
      setError(err.message || `Failed to cancel training #${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTrainingIds, saveActiveTrainingIds]);

  return {
    trainings,
    trainingForm,
    loading,
    error,
    activeTrainingIds,
    fetchTrainings,
    refreshTrainings,
    createTraining: startTraining,
    directStartTraining,
    updateTrainingForm,
    resetTrainingForm,
    getTrainingById,
    stopTraining,
    DEFAULT_TRAINING_FORM
  };
}