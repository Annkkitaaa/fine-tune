import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Make sure this matches your backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'access_token';

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register'
};

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    // Use the correct base URL without any path
    const baseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    
    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
    
    // Log the base URL for debugging
    console.log("API client initialized with baseURL:", baseURL);
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`${config.method?.toUpperCase()} Request to: ${config.baseURL}${config.url}`);
        
        // Don't set content-type for FormData requests
        if (config.data instanceof FormData) {
          config.headers = {
            ...config.headers,
            'Content-Type': undefined, // Let browser handle it
          };
        }
        
        // Add auth token if available
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(this.handleError(error));
      }
    );

    this.instance.interceptors.response.use(
      (response) => {
        console.log(`Response from ${response.config.url}: Success (${response.status})`);
        return response.data;
      },
      (error) => {
        console.error("Response interceptor error:", error);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      console.error("Axios Error:", {
        status: axiosError.response?.status,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        data: axiosError.response?.data
      });
      
      // Handle timeout errors specifically
      if (axiosError.code === 'ECONNABORTED') {
        return new Error('Request timed out. The server might be busy or unavailable.');
      }
      
      if (axiosError.response?.data) {
        // Handle validation errors array
        if (Array.isArray(axiosError.response.data)) {
          const errorMessage = axiosError.response.data
            .map((err) => err.msg ?? String(err))
            .filter(Boolean)
            .join(', ');
          return new Error(errorMessage || 'Multiple validation errors occurred');
        }

        // Handle error with detail field
        if (axiosError.response.data.detail) {
          return new Error(String(axiosError.response.data.detail));
        }
        
        // Handle error message field
        if (axiosError.response.data.message) {
          return new Error(String(axiosError.response.data.message));
        }
        
        // Try to stringify the error data as fallback
        try {
          return new Error(JSON.stringify(axiosError.response.data));
        } catch (e) {
          // If all else fails, return generic error with status
          return new Error(`Request failed with status ${axiosError.response?.status || 'unknown'}`);
        }
      }

      // Handle specific status codes with more helpful messages
      switch (axiosError.response?.status) {
        case 400:
          return new Error('Invalid request data. Please check your inputs.');
        case 401:
          localStorage.removeItem(TOKEN_KEY);
          return new Error('Your session has expired. Please log in again.');
        case 403:
          return new Error('You do not have permission to perform this action.');
        case 404:
          return new Error(`Resource not found: ${axiosError.config?.url}`);
        case 422:
          return new Error('The provided data is invalid or incomplete.');
        case 500:
          return new Error('A server error occurred. Please try again or contact support.');
        default:
          return new Error(axiosError.message || 'An error occurred while processing your request.');
      }
    }

    // For non-Axios errors, provide a generic error message
    console.error("Non-Axios Error:", error);
    return new Error('An unexpected error occurred. Please try again.');
  }

  // Utility function to retry API calls
  async withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      
      console.log(`Retrying operation, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay * 1.5);
    }
  }

  async request<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      // Add request ID for debugging
      const requestId = Math.random().toString(36).substring(2, 9);
      console.log(`[${requestId}] Making request to ${endpoint}`);
      
      const response = await this.instance.request<any, T>({
        url: endpoint,
        ...config,
      });
      
      console.log(`[${requestId}] Request successful`);
      return response;
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();