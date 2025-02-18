// src/lib/constants/evaluation.ts
export const DEFAULT_EVALUATION_FORM = {
    modelId: '',
    datasetId: '',
    metrics: {
      accuracy: true,
      precision: true,
      recall: true,
      f1_score: true,
      mse: false,
      rmse: false,
      mae: false,
      r2: false,
    },
    parameters: {
      test_split: 0.2,
      random_seed: 42,
      threshold: 0.5,
    },
  };