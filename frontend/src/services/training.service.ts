// src/services/training.service.ts (not @/lib/services/training)
import api from './api.service';
import { 
  Training, 
  TrainingCreateRequest 
} from '@/types/training.types';

export const trainingService = {
  getTrainings: async () => {
    const response = await api.get('/trainings/list');
    return response.data;
  },

  createTraining: async (data: TrainingCreateRequest) => {
    const response = await api.post('/trainings/create', data);
    return response.data;
  },

  getTrainingById: async (id: number) => {
    const response = await api.get(`/trainings/${id}`);
    return response.data;
  },

  cancelTraining: async (id: number) => {
    await api.post(`/trainings/${id}/cancel`);
  },
};