// src/constants/model.constants.ts
export const FRAMEWORKS = [
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'tensorflow', label: 'TensorFlow' },
  { value: 'jax', label: 'JAX' },
] as const;

export const ARCHITECTURES = [
  { value: 'resnet50', label: 'ResNet50' },
  { value: 'vgg16', label: 'VGG16' },
  { value: 'efficientnet', label: 'EfficientNet' },
] as const;

export const ACTIVATION_FUNCTIONS = [
  { value: 'relu', label: 'ReLU' },
  { value: 'tanh', label: 'Tanh' },
  { value: 'sigmoid', label: 'Sigmoid' },
] as const;