import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'access_token';

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register'
};

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
    this.instance.interceptors.request.use(
      (config) => {
        // Don't set content-type for FormData requests - let the browser handle it
        if (config.data instanceof FormData) {
          if (config.headers) {
            delete (config.headers as any)['Content-Type'];
          }
        }
        
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

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
      
      if (axiosError.response?.data) {
        // Handle validation errors array
        if (Array.isArray(axiosError.response.data)) {
          return new Error(
            axiosError.response.data
              .map((err) => err.msg)
              .filter(Boolean)
              .join(', ')
          );
        }

        // Handle error with detail field
        if (axiosError.response.data.detail) {
          return new Error(String(axiosError.response.data.detail));
        }
      }

      // Handle specific status codes
      switch (axiosError.response?.status) {
        case 400:
          return new Error('Invalid request data');
        case 401:
          localStorage.removeItem(TOKEN_KEY);
          return new Error('Please log in again');
        case 403:
          return new Error('You do not have permission');
        case 404:
          return new Error('Resource not found');
        case 422:
          return new Error('Invalid input data');
        case 500:
          return new Error('Server error occurred');
        default:
          return new Error(axiosError.message || 'An error occurred');
      }
    }

    return new Error('An unexpected error occurred');
  }

  async request<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.instance.request<any, T>({
        url: endpoint,
        ...config,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();