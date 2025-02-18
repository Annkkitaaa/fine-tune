// src/lib/services/training.ts
import { apiClient } from '@/lib/api-client';
import { 
  Training, 
  TrainingCreateRequest 
} from '@/lib/types/training';

export const trainingService = {
  listTrainings: () =>
    apiClient.request<Training[]>('/training/list'),

  getTraining: (id: number) =>
    apiClient.request<Training>(`/training/${id}`),

  startTraining: (data: TrainingCreateRequest) =>
    apiClient.request<Training>('/training/start', {
      method: 'POST',
      data,
    }),

  stopTraining: (trainingId: number) =>
    apiClient.request<Training>(`/training/${trainingId}/stop`, {
      method: 'POST',
    }),

  getTrainingStatus: (trainingId: number) =>
    apiClient.request<Training>(`/training/${trainingId}/status`),
};