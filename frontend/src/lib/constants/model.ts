// src/lib/constants/model.ts
export const FRAMEWORKS = [
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'tensorflow', label: 'TensorFlow' },
  { value: 'sklearn', label: 'Scikit-Learn' }
];

export const ARCHITECTURES = [
  { value: 'mlp', label: 'Multi-layer Perceptron' },
  { value: 'linear', label: 'Linear Model' },
  { value: 'random_forest', label: 'Random Forest' }
];

export const ACTIVATION_FUNCTIONS = [
  { value: 'relu', label: 'ReLU' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'tanh', label: 'Tanh' }
];

// Add optimizer options that match your backend
export const OPTIMIZER_OPTIONS = [
  { value: 'adam', label: 'Adam' },
  { value: 'sgd', label: 'SGD' },
  { value: 'rmsprop', label: 'RMSprop' }
];

// Add batch size options
export const BATCH_SIZE_OPTIONS = [
  { value: '8', label: '8' },
  { value: '16', label: '16' },
  { value: '32', label: '32' },
  { value: '64', label: '64' },
  { value: '128', label: '128' }
];