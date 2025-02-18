// src/lib/constants/pipeline.ts
export const AUGMENTATION_METHODS = [
    { value: 'none', label: 'None' },
    { value: 'rotation', label: 'Rotation' },
    { value: 'flip', label: 'Flip' },
    { value: 'noise', label: 'Noise' },
    { value: 'scaling', label: 'Scaling' },
  ] as const;
  
  export const MISSING_STRATEGIES = [
    { value: 'mean', label: 'Mean' },
    { value: 'median', label: 'Median' },
    { value: 'mode', label: 'Mode' },
    { value: 'constant', label: 'Constant' },
  ] as const;
  
  export const OUTLIER_METHODS = [
    { value: 'zscore', label: 'Z-Score' },
    { value: 'iqr', label: 'IQR' },
    { value: 'isolation_forest', label: 'Isolation Forest' },
  ] as const;
  
  export const DEFAULT_PIPELINE_FORM = {
    datasetId: '',
    config: {
      preprocessing: {
        handleMissingData: true,
        missingStrategy: 'mean',
        handleOutliers: true,
        outlierMethod: 'zscore',
        outlierThreshold: 3.0,
        scaling: true,
        featureEngineering: false
      },
      analysis: {
        performCorrelation: true,
        enableFeatureImportance: true,
        generateVisualizations: true
      },
      augmentation: {
        method: 'none',
        factor: 0.5,
        randomState: 42
      }
    },
  } as const;