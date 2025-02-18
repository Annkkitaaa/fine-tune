// src/types/model.types.ts
export interface Model {
    id: number;
    name: string;
    description?: string;
    framework: string;
    architecture: string;
    version: string;
    config?: ModelConfig;
    owner_id: number;
    project_id?: number;
    metrics?: Record<string, any>;
    size?: number;
    is_default: boolean;
    created_at: string;
    updated_at?: string;
  }
  
  export interface ModelConfig {
    hidden_layers: number[];
    activation: string;
    dropout_rate: number;
  }
  
  export interface ModelFormState {
    name: string;
    description: string;
    framework: string;
    architecture: string;
    version: string;
    config: ModelConfig;
  }
  
  export interface ModelCreateRequest {
    name: string;
    description?: string;
    framework: string;
    architecture: string;
    version?: string;
    config?: ModelConfig;
  }
  
  export type Framework = {
    value: string;
    label: string;
  };
  
  export type Architecture = {
    value: string;
    label: string;
  };
  
  export type ActivationFunction = {
    value: string;
    label: string;
  };