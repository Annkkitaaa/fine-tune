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

  uploadDataset: async (file: File, name?: string, description?: string, format?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Backend might not accept these fields directly, but we'll include them
    // just in case they're needed for future development
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (format) formData.append('format', format);

    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
      // Content-Type is handled by the interceptor
    });
  },

  deleteDataset: async (id: number) => {
    return apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    });
  },
};