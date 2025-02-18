import { Evaluation, EvaluationCreate } from '@/types';

export const evaluationService = {
  evaluateModel: (modelId: number, data: EvaluationCreate) => 
    apiService.post<Evaluation>(`/evaluation/${modelId}/evaluate`, data),
  getEvaluation: (id: number) => 
    apiService.get<Evaluation>(`/evaluation/${id}`),
};