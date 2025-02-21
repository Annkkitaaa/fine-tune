// src/services/datasets.service.ts
import { apiClient } from '@/lib/api-client';
import { Dataset, DatasetConfig } from '@/types/dataset.types';

export const datasetsService = {
  getDatasets: async (params?: { skip?: number; limit?: number }) => {
    return apiClient.request<Dataset[]>('/data/list', {
      method: 'GET',
      params,
    });
  },

  getDataset: async (id: number) => {
    return apiClient.request<Dataset>(`/data/${id}`, {
      method: 'GET',
    });
  },

  uploadDataset: async (formData: FormData) => {
    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
  },

  deleteDataset: async (id: number) => {
    return apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    });
  },

  updateDataset: async (id: number, config: Partial<DatasetConfig>) => {
    return apiClient.request<Dataset>(`/data/${id}`, {
      method: 'PUT',
      data: config,
    });
  },
};