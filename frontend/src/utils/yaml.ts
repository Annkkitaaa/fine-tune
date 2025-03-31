import jsYaml from 'js-yaml';

export interface SpheronManifest {
  name: string;
  description?: string;
  framework: string;
  compute: {
    resources: {
      cpu: number;
      memory: string;
      gpu: number;
    };
    instances: number;
    autoscaling: boolean;
  };
  environment: {
    variables: Record<string, string>;
  };
  storage: {
    models: Array<{
      path: string;
      mount_path: string;
    }>;
    data: Array<{
      path: string;
      mount_path: string;
    }>;
  };
  ports: Array<{
    container_port: number;
    protocol: string;
  }>;
}

export const createSpheronManifest = (config: {
  name: string;
  description?: string;
  framework: string;
  cpu: number;
  memory: number;
  gpu: number;
  instances: number;
  autoscaling: boolean;
  env_vars: Record<string, string>;
  model_path: string;
  data_paths?: Array<{ path: string; mount_path: string }>;
}): string => {
  const manifest: SpheronManifest = {
    name: config.name,
    description: config.description,
    framework: config.framework,
    compute: {
      resources: {
        cpu: config.cpu,
        memory: `${config.memory}Gi`,
        gpu: config.gpu
      },
      instances: config.instances,
      autoscaling: config.autoscaling
    },
    environment: {
      variables: config.env_vars
    },
    storage: {
      models: [
        {
          path: config.model_path,
          mount_path: "/models"
        }
      ],
      data: config.data_paths || []
    },
    ports: [
      {
        container_port: 8000,
        protocol: "http"
      }
    ]
  };
  
  return jsYaml.dump(manifest);
};

export const parseYaml = <T>(yaml: string): T => {
  return jsYaml.load(yaml) as T;
};