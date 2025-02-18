// src/lib/services/pipeline.ts
import { apiClient } from '@/lib/api-client';
import { 
  Pipeline, 
  PipelineFormState 
} from '@/lib/types/pipeline';

export const pipelineService = {
  listPipelines: () =>
    apiClient.request<Pipeline[]>('/pipeline/list'),

  getPipeline: (id: string) =>
    apiClient.request<Pipeline>(`/pipeline/${id}`),

  createPipeline: (data: PipelineFormState) =>
    apiClient.request<Pipeline>('/pipeline/process', {
      method: 'POST',
      data,
    }),

  rerunPipeline: (pipelineId: string) =>
    apiClient.request<Pipeline>(`/pipeline/${pipelineId}/rerun`, {
      method: 'POST',
    }),

  deletePipeline: (pipelineId: string) =>
    apiClient.request(`/pipeline/${pipelineId}`, {
      method: 'DELETE',
    }),
};