// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { formatError } from '@/components/utils/error';
import { DEV_CONFIG } from '@/config/dev-config';

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
      isAuthenticated: DEV_CONFIG.BYPASS_AUTH ? true : false,
      user: DEV_CONFIG.BYPASS_AUTH ? DEV_CONFIG.MOCK_USER : null,
      loading: false,
      error: null,
      token: DEV_CONFIG.BYPASS_AUTH ? DEV_CONFIG.MOCK_TOKEN : localStorage.getItem('access_token'),

      clearError: () => set({ error: null }),

      updateUser: (user: User) => set({ user }),

      checkAuth: async () => {
        // In development mode with bypass enabled, always return authenticated
        if (DEV_CONFIG.BYPASS_AUTH) {
          console.log('Development mode: Authentication bypass enabled for checkAuth');
          set({ 
            isAuthenticated: true, 
            user: DEV_CONFIG.MOCK_USER,
            loading: false,
            token: DEV_CONFIG.MOCK_TOKEN,
            error: null
          });
          return;
        }

        // Normal authentication check
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
        // In development mode with bypass enabled, simulate successful login
        if (DEV_CONFIG.BYPASS_AUTH) {
          console.log('Development mode: Authentication bypass enabled for login');
          console.log(`Mock login with email: ${email}`);
          
          set({ 
            isAuthenticated: true,
            user: DEV_CONFIG.MOCK_USER,
            token: DEV_CONFIG.MOCK_TOKEN,
            loading: false,
            error: null
          });
          return;
        }

        // Normal login process
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
        console.log('🔧 Register function called with:', { email, fullName, bypassAuth: DEV_CONFIG.BYPASS_AUTH });
        
        // In development mode with bypass enabled, simulate successful registration
        if (DEV_CONFIG.BYPASS_AUTH) {
          console.log('Development mode: Authentication bypass enabled for register');
          console.log(`Mock register with email: ${email}, name: ${fullName}`);
          
          set({ 
            loading: false,
            error: null
          });
          return;
        }

        // Normal registration process
        try {
          console.log('🚀 Starting normal registration process...');
          set({ loading: true, error: null });
          
          console.log('📡 Calling authService.register...');
          await authService.register(email, password, fullName);
          console.log('✅ Registration API call successful');
          
          // Optionally auto-login after registration
          // await get().login(email, password);
          
          set({ 
            loading: false,
            error: null
          });
          console.log('✅ Registration completed successfully');
        } catch (error) {
          console.error('❌ Registration failed:', error);
          set({ 
            loading: false,
            error: formatError(error)
          });
          throw error;
        }
      },

      logout: () => {
        // In development mode with bypass enabled, just log the action but stay logged in
        if (DEV_CONFIG.BYPASS_AUTH) {
          console.log('Development mode: Authentication bypass enabled for logout');
          console.log('Mock logout - still authenticated in development mode');
          
          set({ 
            isAuthenticated: true, 
            user: DEV_CONFIG.MOCK_USER,
            token: DEV_CONFIG.MOCK_TOKEN,
            error: null,
            loading: false
          });
          return;
        }

        // Normal logout process
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