// src/components/deployment/SpheronDeploymentForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  AlertCircle, 
  Rocket, 
  Plus, 
  Minus, 
  Cloud
} from 'lucide-react';

interface SpheronDeploymentFormProps {
  models: Array<{ value: string; label: string }>;
  loading: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const SpheronDeploymentForm: React.FC<SpheronDeploymentFormProps> = ({
  models,
  loading,
  onSubmit,
  onCancel
}) => {
  const [config, setConfig] = useState({
    apiKey: '',
    providerProxyUrl: 'http://localhost:3040',
    autoScaling: false
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modelId: '',
    cpu: 1,
    memory: 2,
    gpu: 0,
    instances: 1,
    autoscaling: false,
    env_vars: {}
  });
  
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [error, setError] = useState<string | null>(null);

  // Load Spheron config
  useEffect(() => {
    const savedConfig = localStorage.getItem('spheron_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        
        // Apply defaults if available
        if (parsed.defaultCpu) setFormData(prev => ({ ...prev, cpu: parsed.defaultCpu }));
        if (parsed.defaultMemory) setFormData(prev => ({ ...prev, memory: parsed.defaultMemory }));
        if (parsed.defaultInstances) setFormData(prev => ({ ...prev, instances: parsed.defaultInstances }));
        if (parsed.autoScaling !== undefined) setFormData(prev => ({ ...prev, autoscaling: parsed.autoScaling }));
      } catch (e) {
        console.error('Error parsing saved Spheron config:', e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    if (envVars.length > 1) {
      const newEnvVars = [...envVars];
      newEnvVars.splice(index, 1);
      setEnvVars(newEnvVars);
    }
  };

  const handleSubmit = () => {
    try {
      if (!formData.name) {
        setError('Deployment name is required');
        return;
      }
      
      if (!formData.modelId) {
        setError('Please select a model');
        return;
      }
      
      // Convert env vars array to object
      const env_vars = {};
      envVars.forEach(({ key, value }) => {
        if (key && value) {
          env_vars[key] = value;
        }
      });
      
      // Create payload
      const payload = {
        name: formData.name,
        description: formData.description,
        model_id: parseInt(formData.modelId),
        config: {
          instances: formData.instances,
          cpu: formData.cpu,
          memory: formData.memory,
          gpu: formData.gpu,
          autoscaling: formData.autoscaling,
          env_vars
        }
      };
      
      onSubmit(payload);
    } catch (e) {
      console.error('Error submitting form:', e);
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center">
          <Cloud className="w-5 h-5 mr-2" />
          Deploy with Spheron
        </h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Deployment Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Model Deployment"
              required
            />
            
            <Select
              label="Model"
              options={models}
              value={formData.modelId}
              onChange={(value) => setFormData({ ...formData, modelId: value })}
              required
            />
          </div>
          
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description of your deployment"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="CPU Cores"
              type="number"
              min="1"
              max="4"
              value={formData.cpu.toString()}
              onChange={(e) => handleNumberChange('cpu', e.target.value)}
            />
            
            <Input
              label="Memory (GB)"
              type="number"
              min="1"
              max="8"
              value={formData.memory.toString()}
              onChange={(e) => handleNumberChange('memory', e.target.value)}
            />
            
            <Input
              label="GPU"
              type="number"
              min="0"
              max="1"
              value={formData.gpu.toString()}
              onChange={(e) => handleNumberChange('gpu', e.target.value)}
            />
            
            <Input
              label="Instances"
              type="number"
              min="1"
              max="5"
              value={formData.instances.toString()}
              onChange={(e) => handleNumberChange('instances', e.target.value)}
            />
          </div>
          
          <Switch
            label="Enable Auto-Scaling"
            checked={formData.autoscaling}
            onChange={(checked) => setFormData({ ...formData, autoscaling: checked })}
          />
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">Environment Variables</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addEnvVar}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </div>
            
            {envVars.map((envVar, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="KEY"
                    value={envVar.key}
                    onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="value"
                    value={envVar.value}
                    onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEnvVar(index)}
                    disabled={envVars.length === 1}
                    className="w-full"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end space-x-4">
            <Button 
              variant="secondary" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.modelId}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy with Spheron
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};