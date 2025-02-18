// src/services/deployment.service.ts
import { apiClient } from '@/lib/api-client';
import { 
  Deployment, 
  DeploymentCreateRequest,
  DeploymentStatus 
} from '@/types/deployment.types';

export const deploymentService = {
  getDeployments: () =>
    apiClient.request<Deployment[]>('/deployment/list'),

  createDeployment: (data: DeploymentCreateRequest) =>
    apiClient.request<Deployment>('/deployment/create', {
      method: 'POST',
      data,
    }),

  toggleStatus: (deploymentId: number, currentStatus: DeploymentStatus) =>
    apiClient.request<Deployment>(`/deployment/${deploymentId}/${currentStatus === 'running' ? 'stop' : 'start'}`, {
      method: 'POST',
    }),

  restartDeployment: (deploymentId: number) =>
    apiClient.request<Deployment>(`/deployment/${deploymentId}/restart`, {
      method: 'POST',
    }),

  deleteDeployment: (deploymentId: number) =>
    apiClient.request(`/deployment/${deploymentId}`, {
      method: 'DELETE',
    }),
};