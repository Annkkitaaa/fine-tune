// src/lib/types/training.ts
export interface TrainingMetrics {
    accuracy: number;
    loss: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  }
  
  export interface TrainingStatus {
    cpu_usage: number;
    memory_usage: number;
    gpu_usage: number;
    epochs_completed: number;
    current_epoch: number;
    total_epochs: number;
    training_time: number;
    estimated_time_remaining: number;
  }
  
  export interface Training {
    id: number;
    model_id: number;
    dataset_id: number;
    status: TrainingState;
    metrics?: TrainingMetrics;
    hyperparameters: TrainingHyperparameters;
    start_time?: string;
    end_time?: string;
    created_at: string;
    updated_at: string;
    duration?: number;
    error_message?: string;
  }
  
  export type TrainingState = 'queued' | 'running' | 'completed' | 'failed' | 'stopped';
  
  export interface TrainingHyperparameters {
    learning_rate: number;
    batch_size: number;
    epochs: number;
    optimizer: {
      name: string;
      beta1: number;
      beta2: number;
    };
  }
  
  export interface TrainingFormState {
    modelId: string;
    datasetId: string;
    hyperparameters: TrainingHyperparameters;
  }
  
  export interface TrainingCreateRequest {
    model_id: number;
    dataset_id: number;
    hyperparameters: TrainingHyperparameters;
  }