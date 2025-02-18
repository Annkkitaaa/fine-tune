// src/lib/constants/deployment.ts
export const INSTANCE_TYPES = [
    {
      value: 'cpu-small',
      label: 'CPU Small (2 vCPU, 4GB RAM)',
      specs: {
        vcpu: 2,
        ram: 4,
      },
    },
    {
      value: 'cpu-medium',
      label: 'CPU Medium (4 vCPU, 8GB RAM)',
      specs: {
        vcpu: 4,
        ram: 8,
      },
    },
    {
      value: 'gpu-small',
      label: 'GPU Small (4 vCPU, 16GB RAM, 1 GPU)',
      specs: {
        vcpu: 4,
        ram: 16,
        gpu: 1,
      },
    },
  ] as const;