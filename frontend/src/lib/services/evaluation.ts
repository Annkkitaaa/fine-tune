// src/lib/services/evaluation.ts
import { apiClient } from '@/lib/api-client';
import { 
  Evaluation, 
  EvaluationCreateRequest 
} from '@/lib/types/evaluation';

export const evaluationService = {
  listEvaluations: () =>
    apiClient.request<Evaluation[]>('/evaluation/list'),

  getEvaluation: (id: number) =>
    apiClient.request<Evaluation>(`/evaluation/${id}`),

  evaluateModel: (modelId: number, data: EvaluationCreateRequest) =>
    apiClient.request<Evaluation>(`/evaluation/${modelId}/evaluate`, {
      method: 'POST',
      data,
    }),
};
