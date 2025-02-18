// src/lib/api-client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { HTTPValidationError, ValidationError } from '@/types/auth.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
      const axiosError = error as AxiosError<HTTPValidationError>;
      
      // Handle FastAPI validation errors
      if (axiosError.response?.status === 422) {
        const validationErrors = axiosError.response.data.detail;
        if (Array.isArray(validationErrors)) {
          const messages = validationErrors
            .map((err: ValidationError) => {
              const field = err.loc[err.loc.length - 1];
              return `${field}: ${err.msg}`;
            })
            .join(', ');
          return new Error(messages);
        }
      }

      // Handle other error responses
      if (axiosError.response?.data?.detail) {
        return new Error(axiosError.response.data.detail);
      }

      // Handle specific status codes
      switch (axiosError.response?.status) {
        case 400:
          return new Error('Invalid request data');
        case 401:
          return new Error('Please log in again');
        case 403:
          return new Error('You do not have permission');
        case 404:
          return new Error('Resource not found');
        case 500:
          return new Error('Server error, please try again later');
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
}