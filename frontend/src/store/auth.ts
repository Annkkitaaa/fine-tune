// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { formatError } from '@/components/utils/error';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
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

      clearError: () => set({ error: null }),

      updateUser: (user: User) => set({ user }),

      checkAuth: async () => {
        try {
          set({ loading: true, error: null });
          
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ 
              isAuthenticated: false, 
              user: null,
              loading: false,
              token: null,
              error: null 
            });
            return;
          }

          const user = await authService.getCurrentUser();
          set({ 
            isAuthenticated: true, 
            user,
            loading: false,
            token,
            error: null
          });
        } catch (error) {
          localStorage.removeItem('access_token');
          set({ 
            isAuthenticated: false, 
            user: null,
            loading: false,
            token: null,
            error: formatError(error)
          });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authService.login(email, password);
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            
            // Fetch user details after successful login
            const user = await authService.getCurrentUser();
            
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
          set({ 
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: formatError(error)
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          
          await authService.register(email, password, fullName);
          
          // Optionally auto-login after registration
          // await get().login(email, password);
          
          set({ 
            loading: false,
            error: null
          });
        } catch (error) {
          set({ 
            loading: false,
            error: formatError(error)
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