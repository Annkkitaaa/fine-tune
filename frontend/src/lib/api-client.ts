// src/lib/api-client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
  input?: any;
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // Handle validation errors array
      if (Array.isArray(axiosError.response?.data)) {
        const validationErrors = axiosError.response?.data as ValidationError[];
        const messages = validationErrors.map(err => err.msg).join(', ');
        return new Error(messages);
      }

      // Handle object with detail field
      if (axiosError.response?.data?.detail) {
        const detail = axiosError.response.data.detail;
        return new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      // Handle specific status codes
      switch (axiosError.response?.status) {
        case 400:
          return new Error('Bad Request: Invalid data provided');
        case 401:
          return new Error('Unauthorized: Please log in again');
        case 403:
          return new Error('Forbidden: You do not have permission');
        case 422:
          return new Error('Validation Error: Please check your input');
        case 500:
          return new Error('Server Error: Please try again later');
        default:
          return new Error(axiosError.message || 'An error occurred');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred');
  }

  async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const response = await this.instance({
        url: endpoint,
        ...options,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper methods for common HTTP methods
  async get<T>(endpoint: string, config = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data = {}, config = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      data,
    });
  }

  async put<T>(endpoint: string, data = {}, config = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      data,
    });
  }

  async delete<T>(endpoint: string, config = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();