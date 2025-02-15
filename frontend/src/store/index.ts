import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  toggleTheme: () => void;
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  theme: 'dark',
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));