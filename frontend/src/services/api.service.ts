// src/services/api.service.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = 
      error.response?.data?.detail || 
      error.response?.data?.message || 
      'An unexpected error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;