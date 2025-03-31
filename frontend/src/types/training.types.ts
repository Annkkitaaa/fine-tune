// src/lib/types/training.ts

// Available training states
export type TrainingState = 'queued' | 'running' | 'completed' | 'failed' | 'stopped';

// Optimizer configuration
export interface OptimizerConfig {
  name: string;
  learning_rate?: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
  weight_decay?: number;
}

// Training hyperparameters
export interface TrainingHyperparameters {
  learning_rate: number;
  batch_size: number;
  epochs: number;
  optimizer: OptimizerConfig;
  [key: string]: any; // Allow additional hyperparameters
}

// Training metrics
export interface TrainingMetrics {
  loss?: number;
  accuracy?: number;
  epochs_completed?: number;
  training_time?: number;
  cpu_usage?: number;
  memory_usage?: number;
  gpu_usage?: number;
  [key: string]: any; // Allow additional metrics
}

// Training model
export interface Training {
  id: number;
  model_id: number;
  dataset_id: number;
  owner_id: number;
  project_id?: number;
  status: TrainingState;
  hyperparameters: TrainingHyperparameters;
  metrics?: TrainingMetrics;
  error_message?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

// Request to create a new training job
export interface TrainingCreateRequest {
  model_id: number;
  dataset_id: number;
  hyperparameters: TrainingHyperparameters;
}

// Form state for training form
export interface TrainingFormState {
  modelId: string;
  datasetId: string;
  hyperparameters: TrainingHyperparameters;
}

// Default form values
export const DEFAULT_TRAINING_FORM: TrainingFormState = {
  modelId: '',
  datasetId: '',
  hyperparameters: {
    learning_rate: 0.001,
    batch_size: 32,
    epochs: 10,
    optimizer: {
      name: 'Adam',
      beta1: 0.9,
      beta2: 0.999,
      epsilon: 1e-7
    }
  }
};