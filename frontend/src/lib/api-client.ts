// src/lib/api-client.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'access_token';

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: any;
}

interface ApiErrorDetail {
  detail?: ValidationError[] | string;
  message?: string;
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

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
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

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorDetail>;
      
      // Handle validation errors array
      if (axiosError.response?.data) {
        const { data } = axiosError.response;

        // Handle array of validation errors
        if (Array.isArray(data)) {
          const messages = data
            .map((err: ValidationError) => err.msg)
            .filter(Boolean)
            .join(', ');
          return new Error(messages || 'Validation error occurred');
        }

        // Handle error with detail field
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            return new Error(data.detail.map(err => err.msg).join(', '));
          }
          return new Error(String(data.detail));
        }

        // Handle error with message field
        if (data.message) {
          return new Error(data.message);
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
          return new Error('Validation error occurred');
        case 500:
          return new Error('Server error occurred');
        default:
          return new Error(axiosError.message || 'An error occurred');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred');
  }

  async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async get<T>(
    endpoint: string, 
    options: Omit<AxiosRequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'GET' 
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: Omit<AxiosRequestConfig, 'method' | 'data'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      data,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: Omit<AxiosRequestConfig, 'method' | 'data'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      data,
    });
  }

  async delete<T>(
    endpoint: string,
    options: Omit<AxiosRequestConfig, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  async postForm<T>(
    endpoint: string,
    data: Record<string, any>,
    options: Omit<AxiosRequestConfig, 'method' | 'data' | 'headers'> = {}
  ): Promise<T> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData,
    });
  }
}

export const apiClient = new ApiClient();