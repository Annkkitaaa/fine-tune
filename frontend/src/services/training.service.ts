import { Training, TrainingCreate } from '@/types';

export const trainingService = {
  startTraining: (data: TrainingCreate) => 
    apiService.post<Training>('/training/start', data),
  getTrainingStatus: (id: number) => 
    apiService.get<Training>(`/training/${id}/status`),
};
