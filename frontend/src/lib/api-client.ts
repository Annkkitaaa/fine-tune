// src/lib/api-client.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'access_token'; // Consistent token key

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`Making request to ${config.url}:`, {
          method: config.method,
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
        }
        
        if (axios.isAxiosError(error) && error.response) {
          console.error('Request failed:', {
            endpoint: error.config?.url,
            status: error.response.status,
            data: error.response.data,
          });

          // Handle validation errors (422)
          if (error.response.status === 422) {
            const errorData = error.response.data;
            if (Array.isArray(errorData)) {
              // Handle array of validation errors
              const message = errorData.map((err: any) => err.msg).join(', ');
              throw new Error(message);
            } else if (typeof errorData.detail === 'string') {
              throw new Error(errorData.detail);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async request<T>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response = await this.client({
        url: endpoint,
        ...options,
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || error.message;
        throw new Error(typeof message === 'string' ? message : 'An error occurred');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();