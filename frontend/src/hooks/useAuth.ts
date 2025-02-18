// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface User {
  email: string;
  full_name: string | null;
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
  checkAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      token: localStorage.getItem('access_token'),

      checkAuth: () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ 
            isAuthenticated: false, 
            user: null,
            token: null
          });
          return;
        }

        set({ 
          isAuthenticated: true,
          token
        });
      },

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await apiClient.postForm<LoginResponse>('/api/v1/auth/login', {
            username: email,
            password,
            grant_type: 'password'
          });

          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            
            // Create user object from login data
            const user: User = {
              email,
              full_name: null // Can be updated later if needed
            };
            
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
          }
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          
          await apiClient.post('/api/v1/auth/register', {
            email,
            password,
            full_name: fullName
          });

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