// src/types/auth.types.ts
export interface User {
    id: number;
    email: string;
    full_name: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials extends LoginCredentials {
    full_name: string;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
  }