import { Dataset } from '@/types';
import { apiClient } from '@/lib/api-client';

interface DatasetConfig {
  name: string;
  description?: string;
  format: string;
  preprocessing_config?: {
    handle_missing?: boolean;
    missing_strategy?: string;
    handle_outliers?: boolean;
    outlier_method?: string;
    outlier_threshold?: number;
    scaling?: boolean;
    feature_engineering?: boolean;
  };
}

export const datasetsService = {
  // Get list of datasets with optional pagination
  getDatasets: (params?: { skip?: number; limit?: number }) =>
    apiClient.request<Dataset[]>('/data/list', {
      method: 'GET',
      params,
    }),

  // Get single dataset by ID
  getDataset: (id: number) =>
    apiClient.request<Dataset>(`/data/${id}`, {
      method: 'GET',
    }),

  // Upload new dataset with configuration
  uploadDataset: (formData: FormData) =>
    apiClient.request<Dataset>('/data/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    }),

  // Delete dataset by ID
  deleteDataset: (id: number) =>
    apiClient.request(`/data/${id}`, {
      method: 'DELETE',
    }),

  // Update dataset configuration
  updateDataset: (id: number, config: Partial<DatasetConfig>) =>
    apiClient.request<Dataset>(`/data/${id}`, {
      method: 'PUT',
      data: config,
    }),
};
