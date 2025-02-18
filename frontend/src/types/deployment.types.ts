// src/types/deployment.types.ts
export interface DeploymentMetrics {
    cpu: number;
    memory: number;
    requests: number;
    latency: number;
  }
  
  export interface Deployment {
    id: number;
    name: string;
    description?: string;
    model_id: number;
    model_name?: string;
    owner_id: number;
    status: DeploymentStatus;
    endpoint_url?: string;
    instances: number;
    metrics?: DeploymentMetrics;
    start_time?: string;
    created_at: string;
    updated_at?: string;
  }
  
  export type DeploymentStatus = 'running' | 'stopped' | 'failed' | 'pending';
  
  export interface DeploymentFormState {
    name: string;
    description: string;
    modelId: string;
    instanceType: string;
    minInstances: number;
    maxInstances: number;
    scalingThreshold: number;
  }
  
  export interface DeploymentCreateRequest {
    name: string;
    description?: string;
    model_id: number;
    instance_type: string;
    min_instances: number;
    max_instances: number;
    scaling_threshold: number;
  }
  
  export interface MetricsData {
    name: string;
    requests: number;
    latency: number;
    cpu: number;
    memory: number;
  }
  
  export type InstanceType = {
    value: string;
    label: string;
    specs: {
      vcpu: number;
      ram: number;
      gpu?: number;
    };
  };