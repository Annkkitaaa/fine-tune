// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
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
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      token: localStorage.getItem('access_token'),

      checkAuth: async () => {
        try {
          set({ loading: true, error: null });
          
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ 
              isAuthenticated: false, 
              user: null, 
              token: null,
              loading: false 
            });
            return;
          }

          const user = await apiClient.get<User>('/auth/me');
          set({ 
            isAuthenticated: true, 
            user,
            token,
            loading: false,
            error: null
          });
        } catch (error) {
          localStorage.removeItem('access_token');
          set({ 
            isAuthenticated: false, 
            user: null,
            token: null,
            loading: false,
            error: null // Don't show error for auth check
          });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          // Use form data for login as required by FastAPI
          const response = await apiClient.postForm<LoginResponse>('/auth/login', {
            username: email, // API expects username field
            password,
            grant_type: 'password'
          });

          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            
            // Fetch user details
            const user = await apiClient.get<User>('/auth/me');
            
            set({ 
              isAuthenticated: true,
              user,
              token: response.access_token,
              loading: false,
              error: null
            });
          } else {
            throw new Error('No access token received');
          }
        } catch (error) {
          localStorage.removeItem('access_token');
          if (error instanceof Error) {
            set({ 
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: error.message
            });
            throw error;
          }
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          
          await apiClient.post('/auth/register', {
            email,
            password,
            full_name: fullName
          });

          // Don't auto-login after registration
          set({ 
            loading: false,
            error: null
          });
        } catch (error) {
          if (error instanceof Error) {
            set({ 
              loading: false,
              error: error.message
            });
            throw error;
          }
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ 
          isAuthenticated: false, 
          user: null,
          token: null,
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
        token: state.token,
      }),
    }
  )
);

// Optionally export type
export type AuthStore = ReturnType<typeof useAuth>;