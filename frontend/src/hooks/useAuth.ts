// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, AUTH_ENDPOINTS } from '@/lib/api-client';

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
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      token: localStorage.getItem('access_token'),

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const formData = new URLSearchParams();
          formData.append('username', email);
          formData.append('password', password);
          formData.append('grant_type', 'password');

          const response = await apiClient.request<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: formData
          });

          // Check if we have a valid response with access_token
          if (response && response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            
            // Create user object from login data
            const user: User = {
              email,
              full_name: null
            };
            
            set({ 
              isAuthenticated: true,
              user,
              token: response.access_token,
              loading: false,
              error: null
            });
          } else {
            throw new Error('Invalid login response');
          }
        } catch (error) {
          localStorage.removeItem('access_token');
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          
          await apiClient.request(AUTH_ENDPOINTS.REGISTER, {
            method: 'POST',
            data: {
              email,
              password,
              full_name: fullName
            }
          });

          set({ loading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            loading: false,
            error: errorMessage
          });
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