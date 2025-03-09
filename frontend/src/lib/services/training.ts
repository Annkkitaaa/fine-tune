// src/lib/services/training.ts
import { apiClient } from '@/lib/api-client';
import {
  Training,
  TrainingCreateRequest
} from '@/lib/types/training';

// No need to include /api/v1 prefix as it's already in the baseURL
export const trainingService = {
  // This is a mock implementation since there's no list endpoint
  listTrainings: async (): Promise<Training[]> => {
    console.log("[TrainingService] listTrainings called");
    try {
      // Get saved training IDs from localStorage
      const trainingIdsStr = localStorage.getItem('ml_platform_training_ids');
      if (!trainingIdsStr) {
        console.log("[TrainingService] No training IDs found in localStorage");
        return [];
      }
      
      const trainingIds = JSON.parse(trainingIdsStr);
      console.log("[TrainingService] Found training IDs:", trainingIds);
      
      // Fetch each training status
      const trainingsPromises = trainingIds.map((id: number) => 
        trainingService.getTrainingStatus(id)
          .catch(err => {
            console.error(`[TrainingService] Error fetching training ${id}:`, err);
            return null;
          })
      );
      
      const results = await Promise.all(trainingsPromises);
      const validTrainings = results.filter(Boolean) as Training[];
      
      console.log("[TrainingService] Retrieved trainings:", validTrainings.length);
      return validTrainings;
    } catch (error) {
      console.error("[TrainingService] Error in listTrainings:", error);
      return [];
    }
  },
  
  getTrainingStatus: async (trainingId: number): Promise<Training> => {
    console.log(`[TrainingService] getTrainingStatus for ID: ${trainingId}`);
    // Remove the /api/v1 prefix
    return apiClient.request<Training>(`/training/${trainingId}/status`);
  },
  
  startTraining: async (data: TrainingCreateRequest): Promise<Training> => {
    console.log("[TrainingService] startTraining called with data:", data);
    
    try {
      // Remove the /api/v1 prefix
      const response = await apiClient.request<Training>('/training/start', {
        method: 'POST',
        data,
      });
      
      console.log("[TrainingService] Training started successfully:", response);
      
      // Save the training ID to localStorage
      if (response && response.id) {
        const existingIdsStr = localStorage.getItem('ml_platform_training_ids');
        let existingIds: number[] = [];
        
        if (existingIdsStr) {
          try {
            existingIds = JSON.parse(existingIdsStr);
          } catch (e) {
            console.error("[TrainingService] Error parsing training IDs:", e);
          }
        }
        
        if (!existingIds.includes(response.id)) {
          existingIds.push(response.id);
          localStorage.setItem('ml_platform_training_ids', JSON.stringify(existingIds));
          console.log("[TrainingService] Added training ID to localStorage:", response.id);
        }
      }
      
      return response;
    } catch (error) {
      console.error("[TrainingService] Error starting training:", error);
      throw error;
    }
  },
  
  // Try to stop training - may not be implemented on backend
  stopTraining: async (trainingId: number): Promise<Training> => {
    console.log(`[TrainingService] stopTraining for ID: ${trainingId}`);
    
    try {
      // Try the stop endpoint if it exists - Remove the /api/v1 prefix
      try {
        const response = await apiClient.request<Training>(`/training/${trainingId}/stop`, {
          method: 'POST'
        });
        console.log("[TrainingService] Training stopped via API:", response);
        return response;
      } catch (e) {
        console.log("[TrainingService] Stop endpoint not available, using status as fallback");
        
        // Fallback - get current status and mark as stopped in UI
        const currentStatus = await trainingService.getTrainingStatus(trainingId);
        return {
          ...currentStatus,
          status: 'stopped'
        };
      }
    } catch (error) {
      console.error("[TrainingService] Error stopping training:", error);
      throw error;
    }
  },
  
  // Direct API call for emergency use
  directTrainingStart: async (data: TrainingCreateRequest): Promise<any> => {
    console.log("[TrainingService] directTrainingStart with data:", data);
    
    // Get auth token if used
    const token = localStorage.getItem('access_token');
    
    try {
      // Make sure to use the correct URL without duplication
      const response = await fetch('http://localhost:8000/api/v1/training/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      
      console.log("[TrainingService] Direct API response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("[TrainingService] Direct API response data:", result);
      
      // Save to localStorage
      if (result && result.id) {
        const existingIdsStr = localStorage.getItem('ml_platform_training_ids');
        let existingIds: number[] = [];
        
        if (existingIdsStr) {
          try {
            existingIds = JSON.parse(existingIdsStr);
          } catch (e) {
            console.error("[TrainingService] Error parsing training IDs:", e);
          }
        }
        
        if (!existingIds.includes(result.id)) {
          existingIds.push(result.id);
          localStorage.setItem('ml_platform_training_ids', JSON.stringify(existingIds));
        }
      }
      
      return result;
    } catch (error) {
      console.error("[TrainingService] Error in directTrainingStart:", error);
      throw error;
    }
  }
};