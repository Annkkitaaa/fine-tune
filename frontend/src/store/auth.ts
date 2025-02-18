// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

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

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
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
          await authService.login(username, password);
          const user = await authService.getCurrentUser();
          set({ 
            isAuthenticated: true,
            user,
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            isAuthenticated: false,
            user: null,
            loading: false,
            error: error.message
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ loading: true, error: null });
          await authService.register(email, password, fullName);
          set({ loading: false });
        } catch (error: any) {
          set({ 
            loading: false,
            error: error.message
          });
          throw error;
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