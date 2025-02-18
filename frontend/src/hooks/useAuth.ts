// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api.service';
import { 
  User, 
  LoginResponse, 
  LoginRequest, 
  RegisterRequest, 
  ValidationError 
} from '../types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: !!localStorage.getItem('access_token'),
      user: null,
      loading: false,
      error: null,

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ loading: true });
          const response = await api.get<User>('/auth/me');
          set({ 
            isAuthenticated: true, 
            user: response.data,
            loading: false,
            error: null
          });
        } catch (error: any) {
          localStorage.removeItem('access_token');
          set({ 
            isAuthenticated: false, 
            user: null, 
            loading: false,
            error: extractError(error)
          });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const loginData: LoginRequest = {
            username: email, // API expects username but we use email
            password
          };
          
          const response = await api.post<LoginResponse>('/auth/login', loginData);
          
          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            
            // Fetch user details after successful login
            const userResponse = await api.get<User>('/auth/me');
            
            set({ 
              isAuthenticated: true, 
              user: userResponse.data,
              loading: false,
              error: null
            });
          } else {
            throw new Error('No access token received');
          }
        } catch (error: any) {
          set({ 
            isAuthenticated: false,
            loading: false,
            error: extractError(error)
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          
          const registerData: RegisterRequest = {
            email,
            password,
            full_name: fullName
          };
          
          await api.post('/auth/register', registerData);
          
          // After successful registration, login with the same credentials
          await get().login(email, password);
        } catch (error: any) {
          set({ 
            loading: false,
            error: extractError(error)
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ 
          isAuthenticated: false, 
          user: null,
          error: null,
          loading: false
        });
      },

      clearError: () => set({ error: null }),

      updateUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Enhanced error extraction function
function extractError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle validation errors array
  if (Array.isArray(error.response?.data)) {
    const validationError = error.response.data[0] as ValidationError;
    if (validationError?.msg && validationError?.loc) {
      return `${validationError.msg} (${validationError.loc.join('.')})`;
    }
  }

  // Handle detail field in response
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  // Handle direct error message
  if (error.message) {
    return error.message;
  }

  // Handle other error responses
  if (error.response?.status === 401) {
    return 'Authentication failed';
  }
  if (error.response?.status === 403) {
    return 'Access denied';
  }
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  if (error.response?.status === 422) {
    return 'Invalid data provided';
  }
  if (error.response?.status >= 500) {
    return 'Server error occurred';
  }

  return 'An unexpected error occurred';
}

// API interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth state
      const auth = useAuth.getState();
      auth.logout();
    }
    return Promise.reject(error);
  }
);

export type AuthStore = ReturnType<typeof useAuth>;