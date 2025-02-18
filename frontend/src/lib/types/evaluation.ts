// src/lib/types/evaluation.ts
export interface EvaluationMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    confusion_matrix?: number[][];
    feature_importance?: Record<string, number>;
  }
  
  export interface Evaluation {
    id: number;
    model_id: number;
    dataset_id: number;
    metrics: EvaluationMetrics;
    parameters: EvaluationParameters;
    execution_time: number;
    created_at: string;
    updated_at?: string;
  }
  
  export interface EvaluationParameters {
    test_split: number;
    random_seed: number;
    threshold: number;
  }
  
  export interface EvaluationFormState {
    modelId: string;
    datasetId: string;
    metrics: {
      accuracy: boolean;
      precision: boolean;
      recall: boolean;
      f1_score: boolean;
      mse: boolean;
      rmse: boolean;
      mae: boolean;
      r2: boolean;
    };
    parameters: EvaluationParameters;
  }
  
  export interface EvaluationCreateRequest {
    dataset_id: number;
    metrics: {
      accuracy: boolean;
      precision: boolean;
      recall: boolean;
      f1_score: boolean;
      mse: boolean;
      rmse: boolean;
      mae: boolean;
      r2: boolean;
    };
    parameters: EvaluationParameters;
  }