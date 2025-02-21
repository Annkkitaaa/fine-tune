// src/types/datasets.ts
export interface PreprocessingConfig {
  handle_missing: boolean;
  missing_strategy?: string;
  handle_outliers?: boolean;
  outlier_method?: string;
  outlier_threshold?: number;
  scaling?: boolean;
  feature_engineering?: boolean;
}

export interface Dataset {
  id: number;
  name: string;
  description?: string | null;
  format: string;
  preprocessing_config?: PreprocessingConfig;
  owner_id: number;
  project_id?: number;
  file_path: string;
  size?: number;
  num_rows?: number;
  num_features?: number;
  meta_info?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface DatasetFormState {
  name: string;
  description: string;
  format: string;
  handleMissingData: boolean;
  missingStrategy: string;
  handleOutliers: boolean;
  outlierMethod: string;
  outlierThreshold: number;
  enableScaling: boolean;
  enableFeatureEngineering: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}