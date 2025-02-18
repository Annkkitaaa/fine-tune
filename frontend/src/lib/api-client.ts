// src/lib/api-client.ts

import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Handle validation error array
    if (Array.isArray(axiosError.response?.data)) {
      const validationErrors = axiosError.response?.data as ValidationError[];
      return validationErrors.map(err => err.msg).join(', ');
    }
    
    // Handle object with detail field
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      return typeof detail === 'string' ? detail : JSON.stringify(detail);
    }
    
    // Handle other error messages
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Default error message based on status
    if (axiosError.response?.status === 400) {
      return 'Invalid request data';
    }
    if (axiosError.response?.status === 401) {
      return 'Authentication failed';
    }
    if (axiosError.response?.status === 422) {
      return 'Invalid input data';
    }

    return axiosError.message;
  }
  
  // Handle non-Axios errors
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = extractErrorMessage(error);
    return Promise.reject(new Error(errorMessage));
  }
);