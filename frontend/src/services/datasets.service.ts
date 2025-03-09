// src/services/datasets.service.ts
import { apiClient } from '@/lib/api-client';
import { Dataset } from '@/types/dataset.types';

export const datasetsService = {
  getDatasets: (params = {}) => 
    apiClient.withRetry(() => 
      apiClient.request<Dataset[]>('/data/list', {
        method: 'GET',
        params,
      })
    ),
  
  getDataset: (id: number) =>
    apiClient.request<Dataset>(`/data/${id}`),
  
  uploadDataset: (file: File, name?: string, description?: string, format?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (name) {
      formData.append('name', name);
    }
    
    if (description) {
      formData.append('description', description);
    }
    
    if (format) {
      formData.append('format', format);
    }
    
    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
    });
  },
  
  deleteDataset: (id: number) =>
    apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    }),
};