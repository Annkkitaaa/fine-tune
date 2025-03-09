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

  uploadDataset: async (file: File, metadata: { 
    name: string; 
    description?: string; 
    format: string;
    preprocessing_config?: any;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata to the request
    const requestData = {
      ...metadata,
      preprocessing_config: {
        handle_missing: metadata.preprocessing_config?.handle_missing || false,
        missing_strategy: metadata.preprocessing_config?.missing_strategy || 'mean',
        handle_outliers: metadata.preprocessing_config?.handle_outliers || false,
        outlier_method: metadata.preprocessing_config?.outlier_method || 'zscore',
        outlier_threshold: metadata.preprocessing_config?.outlier_threshold || 3.0,
        scaling: metadata.preprocessing_config?.scaling || true,
        feature_engineering: metadata.preprocessing_config?.feature_engineering || false,
      }
    };
  
    return apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      data: formData,
      headers: {
        // Remove content-type so that axios sets the correct multipart boundary
        'Content-Type': undefined,
      },
    });
  },

  deleteDataset: async (id: number) => {
    return apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    });
  },
};