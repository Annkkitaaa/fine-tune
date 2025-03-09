// src/lib/constants/training.ts
import { TrainingFormState } from '@/lib/types/training';
import { SelectOption } from '@/lib/types/training';

// Batch size options
export const BATCH_SIZE_OPTIONS: SelectOption[] = [
  { value: '8', label: '8' },
  { value: '16', label: '16' },
  { value: '32', label: '32' },
  { value: '64', label: '64' },
  { value: '128', label: '128' },
  { value: '256', label: '256' }
];

// Optimizer options
export const OPTIMIZER_OPTIONS: SelectOption[] = [
  { value: 'Adam', label: 'Adam' },
  { value: 'SGD', label: 'SGD' },
  { value: 'RMSprop', label: 'RMSprop' },
  { value: 'Adagrad', label: 'Adagrad' },
  { value: 'Adadelta', label: 'Adadelta' }
];

// Learning rate options
export const LEARNING_RATE_OPTIONS: SelectOption[] = [
  { value: '0.1', label: '0.1' },
  { value: '0.01', label: '0.01' },
  { value: '0.001', label: '0.001' },
  { value: '0.0001', label: '0.0001' },
  { value: '0.00001', label: '0.00001' }
];

// Default form state
export const DEFAULT_TRAINING_FORM: TrainingFormState = {
  modelId: '',
  datasetId: '',
  hyperparameters: {
    learning_rate: 0.001,
    batch_size: 32,
    epochs: 10,
    optimizer: {
      name: 'Adam',
      beta1: 0.9,
      beta2: 0.999,
      epsilon: 1e-7
    }
  }
};