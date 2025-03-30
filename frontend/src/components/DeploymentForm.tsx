import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { AlertCircle, Rocket } from 'lucide-react';
import { INSTANCE_TYPES } from '@/lib/constants/deployment';

interface DeploymentFormProps {
  models: Array<{ value: string; label: string }>;
  loading: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const DeploymentForm: React.FC<DeploymentFormProps> = ({
  models,
  loading,
  onSubmit,
  onCancel
}) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    modelId: '',
    provider: 'local', // Add provider selection
    instanceType: 'cpu-small',
    minInstances: 1,
    maxInstances: 3,
    scalingThreshold: 80,
    spheron: {
      instances: 1,
      cpu: 1,
      memory: 2,
      gpu: 0,
      autoscaling: false,
      env_vars: {}
    }
  });

  // Add new state for environment variables
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const handleSubmit = () => {
    if (form.provider === 'spheron') {
      // Create Spheron-specific deployment payload
      const spheronPayload = {
        name: form.name,
        description: form.description,
        model_id: parseInt(form.modelId),
        config: {
          instances: form.spheron.instances,
          cpu: form.spheron.cpu,
          memory: form.spheron.memory,
          gpu: form.spheron.gpu,
          autoscaling: form.spheron.autoscaling,
          env_vars: form.spheron.env_vars
        }
      };
      onSubmit({ type: 'spheron', data: spheronPayload });
    } else {
      // Create standard deployment payload
      const standardPayload = {
        name: form.name,
        description: form.description,
        model_id: parseInt(form.modelId),
        instance_type: form.instanceType,
        min_instances: form.minInstances,
        max_instances: form.maxInstances,
        scaling_threshold: form.scalingThreshold,
      };
      onSubmit({ type: 'standard', data: standardPayload });
    }
  };

  const addEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setForm({
        ...form,
        spheron: {
          ...form.spheron,
          env_vars: {
            ...form.spheron.env_vars,
            [newEnvKey]: newEnvValue
          }
        }
      });
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvVar = (key: string) => {
    const newEnvVars = { ...form.spheron.env_vars };
    delete newEnvVars[key];
    setForm({
      ...form,
      spheron: {
        ...form.spheron,
        env_vars: newEnvVars
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Deploy Model</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Select
              label="Model"
              options={models}
              value={form.modelId}
              onChange={(value) => setForm({ ...form, modelId: value })}
            />
            
            {/* Provider selection */}
            <Select
              label="Deployment Provider"
              options={[
                { value: 'local', label: 'Local Deployment' },
                { value: 'spheron', label: 'Spheron Protocol' }
              ]}
              value={form.provider}
              onChange={(value) => setForm({ ...form, provider: value })}
            />
          </div>
          
          {/* Conditional rendering based on provider */}
          {form.provider === 'local' ? (
            <div className="space-y-6">
              <Select
                label="Instance Type"
                options={INSTANCE_TYPES}
                value={form.instanceType}
                onChange={(value) => setForm({ ...form, instanceType: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Instances"
                  type="number"
                  min={1}
                  value={form.minInstances}
                  onChange={(e) => setForm({ 
                    ...form, 
                    minInstances: parseInt(e.target.value) 
                  })}
                />
                <Input
                  label="Max Instances"
                  type="number"
                  min={1}
                  value={form.maxInstances}
                  onChange={(e) => setForm({ 
                    ...form, 
                    maxInstances: parseInt(e.target.value) 
                  })}
                />
              </div>
              <Slider
                label="Scaling Threshold (%)"
                min={50}
                max={95}
                value={form.scalingThreshold}
                onChange={(value) => setForm({ 
                  ...form, 
                  scalingThreshold: value 
                })}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="CPU Cores"
                  type="number"
                  min={1}
                  max={4}
                  value={form.spheron.cpu}
                  onChange={(e) => setForm({ 
                    ...form, 
                    spheron: {
                      ...form.spheron,
                      cpu: parseInt(e.target.value) 
                    }
                  })}
                />
                <Input
                  label="Memory (GB)"
                  type="number"
                  min={1}
                  max={8}
                  value={form.spheron.memory}
                  onChange={(e) => setForm({ 
                    ...form, 
                    spheron: {
                      ...form.spheron,
                      memory: parseInt(e.target.value) 
                    }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="GPU Count"
                  type="number"
                  min={0}
                  max={1}
                  value={form.spheron.gpu}
                  onChange={(e) => setForm({ 
                    ...form, 
                    spheron: {
                      ...form.spheron,
                      gpu: parseInt(e.target.value) 
                    }
                  })}
                />
                <Input
                  label="Instances"
                  type="number"
                  min={1}
                  value={form.spheron.instances}
                  onChange={(e) => setForm({ 
                    ...form, 
                    spheron: {
                      ...form.spheron,
                      instances: parseInt(e.target.value) 
                    }
                  })}
                />
              </div>
              <Switch
                label="Enable Autoscaling"
                checked={form.spheron.autoscaling}
                onChange={(checked) => setForm({ 
                  ...form, 
                  spheron: {
                    ...form.spheron,
                    autoscaling: checked 
                  }
                })}
              />
              
              {/* Environment Variables */}
              <div className="space-y-3">
                <h3 className="text-md font-medium">Environment Variables</h3>
                
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input
                      placeholder="Key"
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      placeholder="Value"
                      value={newEnvValue}
                      onChange={(e) => setNewEnvValue(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      onClick={addEnvVar}
                      className="w-full"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                {Object.entries(form.spheron.env_vars).length > 0 && (
                  <div className="border rounded-md p-3 space-y-2">
                    {Object.entries(form.spheron.env_vars).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <div>
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{key}</span>
                          <span className="mx-2">=</span>
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{value}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEnvVar(key)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button 
            variant="secondary" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Rocket className="w-4 h-4 mr-2" />
            {loading ? 'Deploying...' : 'Deploy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};