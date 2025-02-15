import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';
import { Search, Rocket, Filter, Play, Pause } from 'lucide-react';

export const DeploymentPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [deployForm, setDeployForm] = useState({
    modelId: '',
    instanceType: 'cpu-small',
    minInstances: 1,
    maxInstances: 3,
    scalingThreshold: 80,
  });

  const mockModels = [
    { value: 'model1', label: 'ResNet50 Classifier' },
    { value: 'model2', label: 'Object Detection v2' },
  ];

  const instanceTypes = [
    { value: 'cpu-small', label: 'CPU Small (2 vCPU, 4GB RAM)' },
    { value: 'cpu-medium', label: 'CPU Medium (4 vCPU, 8GB RAM)' },
    { value: 'gpu-small', label: 'GPU Small (4 vCPU, 16GB RAM, 1 GPU)' },
  ];

  const mockDeployments = [
    {
      id: '1',
      model: 'ResNet50 Classifier',
      status: 'running',
      endpoint: 'https://api.mlplatform.com/models/resnet50',
      instances: 2,
      cpu: 45,
      memory: 62,
      requests: '234/s',
      latency: '123ms',
    },
    {
      id: '2',
      model: 'Object Detection v2',
      status: 'stopped',
      endpoint: 'https://api.mlplatform.com/models/objectdetection',
      instances: 0,
      cpu: 0,
      memory: 0,
      requests: '0/s',
      latency: '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deployments</h1>
        <Button onClick={() => setShowDeployForm(!showDeployForm)}>
          <Rocket className="w-4 h-4 mr-2" />
          Deploy Model
        </Button>
      </div>

      {showDeployForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Deploy Model</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Select
                  label="Model"
                  options={mockModels}
                  value={deployForm.modelId}
                  onChange={(value) => setDeployForm({ ...deployForm, modelId: value })}
                />
                <Select
                  label="Instance Type"
                  options={instanceTypes}
                  value={deployForm.instanceType}
                  onChange={(value) => setDeployForm({ ...deployForm, instanceType: value })}
                />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Instances"
                    type="number"
                    min={1}
                    value={deployForm.minInstances}
                    onChange={(e) => setDeployForm({ ...deployForm, minInstances: parseInt(e.target.value) })}
                  />
                  <Input
                    label="Max Instances"
                    type="number"
                    min={1}
                    value={deployForm.maxInstances}
                    onChange={(e) => setDeployForm({ ...deployForm, maxInstances: parseInt(e.target.value) })}
                  />
                </div>
                <Slider
                  label="Scaling Threshold (%)"
                  min={50}
                  max={95}
                  value={deployForm.scalingThreshold}
                  onChange={(value) => setDeployForm({ ...deployForm, scalingThreshold: value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowDeployForm(false)}>
                Cancel
              </Button>
              <Button>Deploy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search deployments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDeployments.map((deployment) => (
              <div
                key={deployment.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{deployment.model}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deployment.endpoint}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        deployment.status === 'running'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {deployment.status}
                    </span>
                    <Button
                      size="sm"
                      variant={deployment.status === 'running' ? 'danger' : 'primary'}
                    >
                      {deployment.status === 'running' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Instances:</span>{' '}
                    {deployment.instances}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">CPU:</span>{' '}
                    {deployment.cpu}%
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Memory:</span>{' '}
                    {deployment.memory}%
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Requests:</span>{' '}
                    {deployment.requests}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Latency:</span>{' '}
                    {deployment.latency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};