// src/lib/types/pipeline.ts
export interface PreprocessingConfig {
    handleMissingData: boolean;
    missingStrategy: string;
    handleOutliers: boolean;
    outlierMethod: string;
    outlierThreshold: number;
    scaling: boolean;
    featureEngineering: boolean;
  }
  
  export interface AnalysisConfig {
    performCorrelation: boolean;
    enableFeatureImportance: boolean;
    generateVisualizations: boolean;
  }
  
  export interface AugmentationConfig {
    method: string;
    factor: number;
    randomState: number;
  }
  
  export interface PipelineConfig {
    preprocessing: PreprocessingConfig;
    analysis: AnalysisConfig;
    augmentation: AugmentationConfig;
  }
  
  export interface PipelineFormState {
    datasetId: string;
    config: PipelineConfig;
  }
  
  export interface DataQualityReport {
    missing_values: number;
    outliers_count: number;
    duplicate_rows: number;
    completeness: number;
  }
  
  export interface PipelineResults {
    processed_rows?: number;
    correlation_matrix?: number[][];
    feature_importance?: Record<string, number>;
    data_quality_report?: DataQualityReport;
    download_url?: string;
  }
  
  export interface Pipeline {
    pipeline_id: string;
    status: PipelineStatus;
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
  
  export type PipelineStatus = 'running' | 'completed' | 'failed' | 'pending';
  
  export type ProcessingMethod = {
    value: string;
    label: string;
  };