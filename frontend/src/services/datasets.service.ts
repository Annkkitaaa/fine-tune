// src/services/datasets.service.ts
import { apiClient } from '@/lib/api-client';
import { Dataset, PreprocessingConfig } from '@/types/dataset.types';

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
  
  uploadDataset: (
    file: File, 
    name?: string, 
    description?: string, 
    format?: string,
    preprocessingConfig?: PreprocessingConfig
  ) => {
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
    
    if (preprocessingConfig) {
      formData.append('preprocessing_config', JSON.stringify(preprocessingConfig));
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

  getDatasetSample: (id: number, filters?: any) =>
    apiClient.request<{
      data: any[];
      columns: string[];
      total_rows: number;
      datatypes: Record<string, string>;
    }>(`/data/${id}/sample`, {
      method: 'GET',
      params: filters,
    }),

  preprocessDataset: (
    id: number,
    preprocessingConfig: PreprocessingConfig,
    selectedColumns?: string[],
    filterCondition?: string
  ) =>
    apiClient.request<{
      processed_id: string;
      sample_data: any[];
      original_rows: number;
      processed_rows: number;
      original_columns: number;
      processed_columns: number;
      original_missing: number;
      processed_missing: number;
      original_outliers: number;
      processed_outliers: number;
      column_stats: Record<string, any>;
    }>(`/data/${id}/preprocess`, {
      method: 'POST',
      data: {
        preprocessing_config: preprocessingConfig,
        selected_columns: selectedColumns,
        filter_condition: filterCondition,
      },
    }),
    
  saveProcessedDataset: (
    id: number,
    processedId: string,
    name: string,
    description?: string
  ) =>
    apiClient.request<Dataset>(`/data/${id}/save-processed`, {
      method: 'POST',
      data: {
        processed_id: processedId,
        name,
        description,
      },
    }),
};