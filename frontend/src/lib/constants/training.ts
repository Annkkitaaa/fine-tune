// src/lib/constants/training.ts
export const DEFAULT_TRAINING_FORM = {
    modelId: '',
    datasetId: '',
    hyperparameters: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 10,
      optimizer: {
        name: 'adam',
        beta1: 0.9,
        beta2: 0.999
      }
    }
  } as const;
  
  export const OPTIMIZER_OPTIONS = [
    { value: 'adam', label: 'Adam' },
    { value: 'sgd', label: 'SGD' },
    { value: 'rmsprop', label: 'RMSprop' },
    { value: 'adagrad', label: 'Adagrad' },
  ] as const;
  
  export const BATCH_SIZE_OPTIONS = [
    { value: '16', label: '16' },
    { value: '32', label: '32' },
    { value: '64', label: '64' },
    { value: '128', label: '128' },
  ] as const;