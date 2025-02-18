// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { AxiosError } from 'axios';

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
  input?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const response = error.response?.data;
    
    // Handle array of validation errors
    if (Array.isArray(response)) {
      return response
        .map((err: ValidationError) => err.msg)
        .filter(Boolean)
        .join(', ');
    }
    
    // Handle single error object
    if (response?.detail) {
      return typeof response.detail === 'string' 
        ? response.detail 
        : 'Validation error occurred';
    }

    // Handle error message
    if (response?.message) {
      return response.message;
    }

    // Handle status code specific messages
    switch (error.response?.status) {
      case 400:
        return 'Invalid request data';
      case 401:
        return 'Authentication failed';
      case 422:
        return 'Invalid input data';
      default:
        return error.message || 'An error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      checkAuth: async () => {
        try {
          if (!localStorage.getItem('access_token')) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ loading: true });
          const user = await authService.getCurrentUser();
          set({ 
            isAuthenticated: true, 
            user,
            loading: false,
            error: null
          });
        } catch (error) {
          set({ 
            isAuthenticated: false, 
            user: null,
            loading: false,
            error: null // Don't show error for auth check
          });
        }
      },

      login: async (username: string, password: string) => {
        try {
          set({ loading: true, error: null });
          const response = await authService.login(username, password);
          const user = await authService.getCurrentUser();
          set({ 
            isAuthenticated: true,
            user,
            loading: false,
            error: null
          });
          return response;
        } catch (error) {
          const errorMessage = extractErrorMessage(error);
          set({ 
            isAuthenticated: false,
            user: null,
            loading: false,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          await authService.register(email, password, fullName);
          set({ loading: false, error: null });
        } catch (error) {
          const errorMessage = extractErrorMessage(error);
          set({ 
            loading: false,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        authService.logout();
        set({ 
          isAuthenticated: false, 
          user: null,
          error: null
        });
      },

      clearError: () => set({ error: null }),
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