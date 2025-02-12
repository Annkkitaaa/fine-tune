// src/services/auth.ts
import api from './api';

export interface AuthError {
  detail: string;
}

export const authService = {
  async login(email: string, password: string) {
    try {
      console.log('Login attempt:', { email });
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('Login response:', response.data);

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error.response?.data || { detail: 'An error occurred during login' };
    }
  },

  async register(data: { email: string; password: string; full_name: string }) {
    try {
      console.log('Register attempt:', { email: data.email });
      const response = await api.post('/auth/register', data);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error);
      throw error.response?.data || { detail: 'An error occurred during registration' };
    }
  }
};