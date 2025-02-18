// src/services/models.service.ts
import api from './api.service';
import { Model, ModelCreateRequest } from '@/types/model.types';

export const modelsService = {
  getModels: async () => {
    const response = await api.get('/models/list');
    return response.data;
  },

  createModel: async (data: ModelCreateRequest) => {
    const response = await api.post('/models/create', data);
    return response.data;
  },

  deleteModel: async (modelId: number) => {
    await api.delete(`/models/${modelId}`);
  },
};