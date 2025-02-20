// src/lib/api-client.ts
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
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('Response error:', {
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response?.data) {
        if (Array.isArray(axiosError.response.data)) {
          const messages = axiosError.response.data
            .map((err) => err.msg)
            .filter(Boolean)
            .join(', ');
          return new Error(messages || 'Validation error occurred');
        }

        if (axiosError.response.data.detail) {
          return new Error(
            typeof axiosError.response.data.detail === 'string'
              ? axiosError.response.data.detail
              : JSON.stringify(axiosError.response.data.detail)
          );
        }
      }

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

    return new Error('An unexpected error occurred');
  }

  async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.instance.request({
        url: endpoint,
        ...options
      });
      return response.data; // ✅ Fix: Return only response data
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async get<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET'
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      data
    });
  }

  async postForm<T>(
    endpoint: string,
    data: Record<string, any>,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData,
    });
  }
}

export const apiClient = new ApiClient();
