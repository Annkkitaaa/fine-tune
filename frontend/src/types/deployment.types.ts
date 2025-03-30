// Add this to the deployment.types.ts file
export interface SpheronDeploymentConfig {
  instances: number;
  cpu: number;
  memory: number;
  gpu: number;
  autoscaling: boolean;
  env_vars: Record<string, string>;
}

export interface SpheronDeploymentRequest {
  name: string;
  description?: string;
  model_id: number;
  config: SpheronDeploymentConfig;
}

// Update the Deployment interface
export interface Deployment {
  id: number;
  name: string;
  description?: string;
  model_id: number;
  model_name?: string;
  owner_id: number;
  status: DeploymentStatus;
  provider: string; // Add provider field
  provider_deployment_id?: string; // Add provider deployment ID
  endpoint_url?: string;
  instances: number;
  metrics?: Partial<DeploymentMetrics>;
  start_time?: string;
  created_at: string;
  updated_at?: string;
}