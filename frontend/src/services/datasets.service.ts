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

  uploadDataset: async (file: File, name: string, description?: string, format?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata if needed - we'll keep this simple for now
    // Note: Based on your API spec, these fields may not be accepted directly in this endpoint
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (format) formData.append('format', format);
  
    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
      // Content-Type is now handled by the interceptor we fixed
    });
  },

  deleteDataset: async (id: number) => {
    return apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    });
  },
};