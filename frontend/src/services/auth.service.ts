// src/services/auth.service.ts
import { apiClient } from '@/lib/api-client';
import { LoginResponse, User, UserCreate } from '@/types/auth.types';

const TOKEN_KEY = 'access_token';

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Create form data as required by OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      const response = await apiClient.request<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formData
      });

      if (response.access_token) {
        localStorage.setItem(TOKEN_KEY, response.access_token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (email: string, password: string, fullName: string): Promise<User> => {
    try {
      // Match the UserCreate schema from the API
      const userData: UserCreate = {
        email,
        password,
        full_name: fullName,
        is_active: true
      };

      const response = await apiClient.request<User>('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: userData
      });

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get<User>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  }
};