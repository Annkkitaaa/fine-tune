// src/services/platform.service.ts
import { apiClient } from '@/lib/api-client';

export interface PlatformStats {
  models: number;
  datasets: number;
  deployments: number;
  activeTraining: number;
}

export const platformService = {
  async getBasicStats(): Promise<PlatformStats> {
    // Return mock data since endpoints don't exist yet
    return {
      models: 0,
      datasets: 0,
      deployments: 0,
      activeTraining: 0
    };
  }
};