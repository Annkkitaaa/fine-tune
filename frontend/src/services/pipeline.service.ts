import { PipelineResponse, PipelineRequest } from '@/types';

export const pipelineService = {
  processPipeline: (data: PipelineRequest) => 
    apiService.post<PipelineResponse>('/pipeline/process', data),
  listPipelines: () => 
    apiService.get<PipelineResponse[]>('/pipeline/list'),
  getPipeline: (id: string) => 
    apiService.get<PipelineResponse>(`/pipeline/${id}`),
  deletePipeline: (id: string) => 
    apiService.delete(`/pipeline/${id}`),
};
