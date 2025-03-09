// src/lib/services/pipeline.ts
import { apiClient } from '@/lib/api-client';
import { 
  Pipeline, 
  PipelineFormState 
} from '@/lib/types/pipeline';

export const pipelineService = {
  listPipelines: () =>
    apiClient.withRetry(() => 
      apiClient.request<Pipeline[]>('/api/v1/pipeline/list')
    ),

  getPipeline: (id: string) =>
    apiClient.request<Pipeline>(`/api/v1/pipeline/${id}`),

  createPipeline: (data: PipelineFormState) => {
    // Transform data structure to match the API's expected format
    const payload = {
      dataset_id: parseInt(data.datasetId, 10), // Convert string to number
      config: {
        preprocessing: {
          handle_missing: data.config.preprocessing.handleMissingData,
          missing_strategy: data.config.preprocessing.missingStrategy,
          handle_outliers: data.config.preprocessing.handleOutliers,
          outlier_method: data.config.preprocessing.outlierMethod,
          outlier_threshold: data.config.preprocessing.outlierThreshold,
          scaling: data.config.preprocessing.scaling,
          feature_engineering: data.config.preprocessing.featureEngineering
        },
        analysis: {
          perform_correlation: data.config.analysis.performCorrelation,
          perform_feature_importance: data.config.analysis.enableFeatureImportance,
          generate_visualizations: data.config.analysis.generateVisualizations
        },
        augmentation: {
          method: data.config.augmentation.method,
          factor: data.config.augmentation.factor,
          random_state: data.config.augmentation.randomState
        }
      }
    };

    console.log("Sending pipeline request:", payload);

    return apiClient.request<Pipeline>('/api/v1/pipeline/process', {
      method: 'POST',
      data: payload,
    });
  },

  rerunPipeline: (pipelineId: string) => {
    // For rerunning, use a direct POST to the process endpoint with just the pipeline_id
    return apiClient.request<Pipeline>(`/api/v1/pipeline/process`, {
      method: 'POST',
      data: {
        pipeline_id: pipelineId
      },
    });
  },

  deletePipeline: (pipelineId: string) =>
    apiClient.request(`/api/v1/pipeline/${pipelineId}`, {
      method: 'DELETE',
    }),
};