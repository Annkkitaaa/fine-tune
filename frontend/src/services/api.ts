// src/services/api.ts
import axios, { AxiosError } from 'axios';
import { config } from '@/config';

export interface ApiError {
  message: string;
  status: number;
}

const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: error.response?.data?.detail || 'An error occurred',
      status: error.response?.status || 500,
    };
    return Promise.reject(apiError);
  }
);

// Model endpoints
export const modelApi = {
  async getModels() {
    const response = await api.get('/models/list');
    return response.data;
  },

  async createModel(data: any) {
    const response = await api.post('/models/create', data);
    return response.data;
  },
};

// Training endpoints
export const trainingApi = {
  async startTraining(data: any) {
    const response = await api.post('/training/start', data);
    return response.data;
  },

  async getTrainingStatus(trainingId: string) {
    const response = await api.get(`/training/${trainingId}/status`);
    return response.data;
  },
};

// Evaluation endpoints
export const evaluationApi = {
  async evaluateModel(modelId: string, data: any) {
    const response = await api.post(`/evaluation/${modelId}/evaluate`, data);
    return response.data;
  },

  async getEvaluation(evaluationId: string) {
    const response = await api.get(`/evaluation/${evaluationId}`);
    return response.data;
  },
};

export default api;