// src/services/datasets.service.ts
import { apiClient } from '@/lib/api-client';
import { Dataset } from '@/types/dataset.types';

export const datasetsService = {
  getDatasets: async (params?: { skip?: number; limit?: number }) => {
    return apiClient.request<Dataset[]>('/data/list', {
      method: 'GET',
      params,
    });
  },

  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);  // Backend expects only 'file' field

    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
      // Don't set Content-Type, let browser handle it
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
};