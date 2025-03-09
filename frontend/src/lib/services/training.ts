// src/lib/services/training.ts
import { apiClient } from '@/lib/api-client';
import {
  Training,
  TrainingCreateRequest
} from '@/lib/types/training';

// Define the API base URL - make sure this matches your backend
const API_BASE = '/api/v1';

export const trainingService = {
  // This is a mock implementation since there's no list endpoint
  listTrainings: async (): Promise<Training[]> => {
    console.log("Mock listTrainings called - returning stored trainings");
    
    try {
      // Get saved training IDs from localStorage
      const trainingIdsStr = localStorage.getItem('ml_platform_training_ids');
      if (!trainingIdsStr) return [];
      
      const trainingIds = JSON.parse(trainingIdsStr) as number[];
      
      // Fetch status for each training ID
      const trainings = await Promise.all(
        trainingIds.map(id => 
          trainingService.getTrainingStatus(id)
            .catch(() => null)
        )
      );
      
      // Filter out failed requests
      return trainings.filter(Boolean) as Training[];
    } catch (error) {
      console.error("Error in listTrainings:", error);
      return [];
    }
  },
  
  // Get a specific training by ID
  getTrainingStatus: async (trainingId: number): Promise<Training> => {
    console.log(`Fetching training status for ID: ${trainingId}`);
    
    return apiClient.request<Training>(`${API_BASE}/training/${trainingId}/status`, {
      method: 'GET'
    });
  },
  
  // Start a new training job
  startTraining: async (data: TrainingCreateRequest): Promise<Training> => {
    console.log("Starting training with data:", data);
    
    try {
      const response = await apiClient.request<Training>(`${API_BASE}/training/start`, {
        method: 'POST',
        data,
      });
      
      console.log("Training started successfully:", response);
      
      // Save the training ID to localStorage
      if (response && response.id) {
        const existingIdsStr = localStorage.getItem('ml_platform_training_ids');
        let existingIds: number[] = [];
        
        if (existingIdsStr) {
          try {
            existingIds = JSON.parse(existingIdsStr);
          } catch (e) {
            console.error("Error parsing training IDs:", e);
          }
        }
        
        if (!existingIds.includes(response.id)) {
          existingIds.push(response.id);
          localStorage.setItem('ml_platform_training_ids', JSON.stringify(existingIds));
        }
      }
      
      return response;
    } catch (error) {
      console.error("Error starting training:", error);
      throw error;
    }
  },
  
  // Mock implementation for stop since the endpoint might not exist
  stopTraining: async (trainingId: number): Promise<Training> => {
    console.log(`Stopping training job: ${trainingId}`);
    
    try {
      // First try to see if a real endpoint exists
      try {
        const response = await apiClient.request<Training>(`${API_BASE}/training/${trainingId}/stop`, {
          method: 'POST'
        });
        console.log("Training stopped via API:", response);
        return response;
      } catch (e) {
        console.log("No stop endpoint, using fallback method");
        
        // Fallback - just get the current status and mark as stopped in UI
        const currentStatus = await trainingService.getTrainingStatus(trainingId);
        return {
          ...currentStatus,
          status: 'stopped'
        };
      }
    } catch (error) {
      console.error("Error in stopTraining:", error);
      throw error;
    }
  }
};