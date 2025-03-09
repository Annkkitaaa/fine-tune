// src/lib/types/pipeline.ts
export interface Pipeline {
  pipeline_id: string;
  status: string;
  dataset_id: number;
  config: PipelineConfig;
  results?: PipelineResults;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  execution_time?: number;
  error_message?: string;
}

export interface PipelineConfig {
  preprocessing: {
    handle_missing: boolean;
    missing_strategy: string;
    handle_outliers: boolean;
    outlier_method: string;
    outlier_threshold: number;
    scaling: boolean;
    feature_engineering: boolean;
  };
  analysis: {
    perform_correlation: boolean;
    perform_feature_importance: boolean;
    generate_visualizations: boolean;
  };
  augmentation: {
    method: string;
    factor: number;
    random_state: number;
  };
}

export interface PipelineResults {
  correlation_matrix?: number[][];
  feature_importance?: Record<string, number>;
  data_quality_report?: {
    missing_values: number;
    outliers_count: number;
    duplicate_rows: number;
    completeness: number;
  };
  download_url?: string;
  processed_rows?: number;
}

export interface PipelineFormState {
  datasetId: string;
  config: {
    preprocessing: {
      handleMissingData: boolean;
      missingStrategy: string;
      handleOutliers: boolean;
      outlierMethod: string;
      outlierThreshold: number;
      scaling: boolean;
      featureEngineering: boolean;
    };
    analysis: {
      performCorrelation: boolean;
      enableFeatureImportance: boolean;
      generateVisualizations: boolean;
    };
    augmentation: {
      method: string;
      factor: number;
      randomState: number;
    };
  };
}