// src/services/auth.service.ts
import { apiClient } from '@/lib/api-client';
import { LoginResponse, User, ValidationError } from '@/types/auth.types';

const TOKEN_KEY = 'access_token';

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.request<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username,
          password
        }
      });
      
      if (response.access_token) {
        localStorage.setItem(TOKEN_KEY, response.access_token);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  register: async (email: string, password: string, fullName: string): Promise<void> => {
    try {
      await apiClient.request('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          email,
          password,
          full_name: fullName
        }
      });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      return await apiClient.request<User>('/auth/me', {
        method: 'GET'
      });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  }
};

const extractErrorMessage = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle array of validation errors
    if (Array.isArray(data)) {
      return data.map((err: ValidationError) => err.msg).join(', ');
    }
    
    // Handle single error with detail
    if (data.detail) {
      return data.detail;
    }
  }
  
  return error.message || 'An unexpected error occurred';
};