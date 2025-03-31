// src/types/training.types.ts
export interface Training {
  id: number;
  model_id: number;
  dataset_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  hyperparameters?: Record<string, any>;
  metrics?: Record<string, any>;
  epochs_completed?: number;
  epochs_total?: number;
  start_time?: string;
  end_time?: string;
  duration?: number;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface TrainingCreateRequest {
  model_id: number;
  dataset_id: number;
  hyperparameters?: Record<string, any>;
}

export const DEFAULT_TRAINING_FORM: TrainingCreateRequest = {
  model_id: 0,
  dataset_id: 0,
  hyperparameters: {
    learning_rate: 0.001,
    batch_size: 32,
    epochs: 10,
    validation_split: 0.2
  }
};