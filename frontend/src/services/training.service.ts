// src/services/training.service.ts
import { apiClient } from '@/lib/api-client';
import { Training, TrainingCreate } from '@/types';

export const trainingService = {
  // Start a new training job
  startTraining: async (data: TrainingCreate) => {
    return apiClient.request<Training>('/training/start', {
      method: 'POST',
      data,
    });
  },
  
  // Get status of a training job
  getTrainingStatus: async (id: number) => {
    return apiClient.request<Training>(`/training/${id}/status`, {
      method: 'GET',
    });
  },
  
  // This is a stub to prevent errors when the code tries to call listTrainings
  listTrainings: async () => {
    console.warn('listTrainings was called but this endpoint does not exist on the server');
    return []; // Return empty array instead of making an API call
  }
};