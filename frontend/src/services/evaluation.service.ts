// src/lib/services/evaluation.ts
import { apiClient } from '@/lib/api-client';
import { 
  Evaluation, 
  EvaluationCreateRequest 
} from '@/types/evaluation.types';

export const evaluationService = {
  listEvaluations: () =>
    apiClient.request<Evaluation[]>('/api/v1/evaluation/list'),

  getEvaluation: (id: number) =>
    apiClient.request<Evaluation>(`/evaluation/${id}`),

  evaluateModel: (modelId: number, data: EvaluationCreateRequest) =>
    apiClient.request<Evaluation>(`/evaluation/${modelId}/evaluate`, {
      method: 'POST',
      data,
    }),
};
