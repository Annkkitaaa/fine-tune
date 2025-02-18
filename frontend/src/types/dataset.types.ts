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
    project_id?: number;
    file_path: string;
    size?: number;
    num_rows?: number;
    num_features?: number;
    meta_info?: Record<string, any>;
    created_at: string;
    updated_at?: string;
  }