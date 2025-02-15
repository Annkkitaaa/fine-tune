export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  framework: string;
  architecture: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  format: string;
  size: number;
  createdAt: string;
}

export interface TrainingJob {
  id: string;
  modelId: string;
  datasetId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  metrics: Record<string, number>;
  createdAt: string;
}