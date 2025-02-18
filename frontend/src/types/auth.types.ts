// src/types/auth.types.ts
export interface User {
  email: string;
  full_name: string | null;
  is_active: boolean;
  id: number;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  is_active?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}