// Auth types
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Model types
export interface Model {
  id: number;
  name: string;
  description?: string;
  framework: string;
  architecture: string;
  version: string;
  config?: Record<string, any>;
  owner_id: number;
  project_id?: number;
  metrics?: Record<string, any>;
  size?: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ModelCreate {
  name: string;
  description?: string;
  framework: string;
  architecture: string;
  version?: string;
  config?: Record<string, any>;
  hyperparameters?: Record<string, any>;
}

// Dataset types
export interface Dataset {
  id: number;
  name: string;
  description?: string;
  format: string;
  preprocessing_config?: {
    handle_missing?: boolean;
    missing_strategy?: string;
    handle_outliers?: boolean;
    outlier_method?: string;
    outlier_threshold?: number;
    scaling?: boolean;
    feature_engineering?: boolean;
  };
  owner_id: number;
  file_path: string;
  size?: number;
  num_rows?: number;
  num_features?: number;
  created_at: string;
  updated_at?: string;
}

// Training types
export interface Training {
  id: number;
  model_id: number;
  dataset_id: number;
  owner_id: number;
  project_id?: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'stopped';
  start_time?: string;
  end_time?: string;
  updated_at: string;
  created_at: string;
  duration?: number;
  epochs_completed?: number;
  training_logs?: Record<string, any>;
  metrics?: Record<string, any>;
  error_message?: string;
  cpu_usage?: number;
  memory_usage?: number;
  gpu_usage?: number;
  hyperparameters?: Record<string, any>;
}

export interface TrainingCreate {
  model_id: number;
  dataset_id: number;
  hyperparameters?: Record<string, any>;
}

// Deployment types
export interface Deployment {
  id: number;
  name: string;
  description?: string;
  model_id: number;
  owner_id: number;
  status: string;
  config?: Record<string, any>;
  endpoint_url?: string;
  created_at: string;
  updated_at?: string;
  start_time?: string;
  end_time?: string;
  error_message?: string;
  metrics?: Record<string, any>;
}

export interface DeploymentCreate {
  name: string;
  description?: string;
  model_id: number;
  config?: Record<string, any>;
  endpoint_url?: string;
}

// Evaluation types
export interface Evaluation {
  id: number;
  model_id: number;
  dataset_id: number;
  owner_id: number;
  metrics: Record<string, any>;
  parameters: Record<string, any>;
  confusion_matrix?: number[][];
  feature_importance?: Record<string, number>;
  execution_time?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCreate {
  dataset_id: number;
  metrics: MetricsConfig;
  parameters: EvaluationParameters;
}

export interface MetricsConfig {
  accuracy?: boolean;
  precision?: boolean;
  recall?: boolean;
  f1_score?: boolean;
  mse?: boolean;
  rmse?: boolean;
  mae?: boolean;
  r2?: boolean;
}

export interface EvaluationParameters {
  test_split?: number;
  random_seed?: number;
  threshold?: number;
}

// Pipeline types
export interface PipelineConfig {
  preprocessing?: {
    handle_missing?: boolean;
    missing_strategy?: string;
    handle_outliers?: boolean;
    outlier_method?: string;
    outlier_threshold?: number;
    scaling?: boolean;
    feature_engineering?: boolean;
  };
  analysis?: {
    perform_correlation?: boolean;
    enable_feature_importance?: boolean;
    generate_visualizations?: boolean;
  };
  augmentation?: {
    method?: string;
    factor?: number;
    random_seed?: number;
  };
}

export interface PipelineResponse {
  pipeline_id: string;
  status: string;
  dataset_id: number;
  config: PipelineConfig;
  results?: Record<string, any>;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  execution_time?: number;
  error_message?: string;
}

export interface PipelineRequest {
  dataset_id: number;
  config: PipelineConfig;
}

export interface PipelineListResponse {
  pipeline_id: string;
  status: string;
  dataset_id: number;
  created_at: string;
  updated_at: string;
  execution_time?: number;
  error_message?: string;
}