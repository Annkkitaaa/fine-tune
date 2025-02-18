// src/hooks/useUser.ts
import { useAuth } from './useAuth';

export const useUser = () => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    user,
    isAuthenticated,
  };
};