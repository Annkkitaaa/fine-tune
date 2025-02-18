import { create } from 'zustand';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from './auth';

// Define the API store interface
interface ApiStore {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Zustand store for managing API state
export const useApiStore = create<ApiStore>((set) => ({
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const { setError } = useApiStore.getState();
    const errorMessage = error.response?.data?.detail || 'An error occurred';
    setError(errorMessage);
    return Promise.reject(error);
  }
);

// API request wrapper with loading state
const request = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any
): Promise<T> => {
  const { setLoading, setError } = useApiStore.getState();
  
  try {
    setLoading(true);
    setError(null);
    
    const response = await apiClient[method](url, data);
    return response.data;
  } catch (error: any) {
    throw error;
  } finally {
    setLoading(false);
  }
};

// API methods
export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) => 
    request('post', '/auth/login', credentials),
  register: (userData: { email: string; password: string; full_name: string }) => 
    request('post', '/auth/register', userData),

  // Models
  getModels: () => request('get', '/models/list'),
  createModel: (modelData: any) => request('post', '/models/create', modelData),
  deleteModel: (modelId: string) => request('delete', `/models/${modelId}`),

  // Datasets
  getDatasets: () => request('get', '/data/list'),
  uploadDataset: (formData: FormData) => request('post', '/data/upload', formData),
  deleteDataset: (datasetId: string) => request('delete', `/data/${datasetId}`),

  // Training
  startTraining: (trainingData: any) => request('post', '/training/start', trainingData),
  getTrainingStatus: (trainingId: string) => request('get', `/training/${trainingId}/status`),

  // Deployment
  createDeployment: (deploymentData: any) => request('post', '/deployment/create', deploymentData),
  listDeployments: () => request('get', '/deployment/list'),
  deleteDeployment: (deploymentId: string) => request('delete', `/deployment/${deploymentId}`),

  // Evaluation
  evaluateModel: (modelId: string, evaluationData: any) => 
    request('post', `/evaluation/${modelId}/evaluate`, evaluationData),
  getEvaluation: (evaluationId: string) => request('get', `/evaluation/${evaluationId}`),

  // Pipeline
  processPipeline: (pipelineData: any) => request('post', '/pipeline/process', pipelineData),
  listPipelines: () => request('get', '/pipeline/list'),
};

export { apiClient };