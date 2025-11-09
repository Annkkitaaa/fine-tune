// src/services/datasets.service.ts
import { apiClient } from '@/lib/api-client';
import { Dataset, PreprocessingConfig } from '@/types/dataset.types';

export const datasetsService = {
  getDatasets: (params = {}) =>
    apiClient.withRetry(() =>
      apiClient.request<Dataset[]>('/api/v1/data/list', {
        method: 'GET',
        params,
      })
    ),

  getDataset: (id: number) =>
    apiClient.request<Dataset>(`/api/v1/data/${id}`),
  
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
    
    return apiClient.request<Dataset>('/api/v1/data/upload', {
      method: 'POST',
      data: formData,
    });
  },

  deleteDataset: (id: number) =>
    apiClient.request(`/api/v1/data/${id}`, {
      method: 'DELETE',
    }),

  getDatasetSample: (id: number, filters?: any) =>
    apiClient.request<{
      data: any[];
      columns: string[];
      total_rows: number;
      datatypes: Record<string, string>;
    }>(`/api/v1/data/${id}/sample`, {
      method: 'GET',
      params: filters,
    }),

  preprocessDataset: (
    id: number,
    preprocessingConfig: PreprocessingConfig,
    selectedColumns?: string[],
    filterCondition?: string
  ) => {
    // Log the preprocessing request for debugging
    console.log("Preprocessing request:", {
      id,
      preprocessingConfig,
      selectedColumns,
      filterCondition
    });
    
    // Ensure preprocessing_config object is properly formatted
    const requestData = {
      preprocessing_config: {
        ...preprocessingConfig,
        // Ensure these keys match what the backend expects
        handle_missing: preprocessingConfig.handle_missing,
        missing_strategy: preprocessingConfig.missing_strategy,
        handle_outliers: preprocessingConfig.handle_outliers,
        outlier_method: preprocessingConfig.outlier_method,
        outlier_threshold: preprocessingConfig.outlier_threshold,
        scaling: preprocessingConfig.scaling,
        feature_engineering: preprocessingConfig.feature_engineering
      },
      selected_columns: selectedColumns || [],
      filter_condition: filterCondition || ""
    };
    
    // Make the API request with improved error handling
    return apiClient.request<{
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
    }>(`/api/v1/data/${id}/preprocess`, {
      method: 'POST',
      data: requestData,
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error("Preprocessing request failed:", error);
      // Re-throw the error to be handled by the component
      throw error;
    });
  },

  saveProcessedDataset: (
    id: number,
    processedId: string,
    name: string,
    description?: string
  ) =>
    apiClient.request<Dataset>(`/api/v1/data/${id}/save-processed`, {
      method: 'POST',
      data: {
        processed_id: processedId,
        name,
        description,
      },
    }),
};