import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Search, Plus, Filter } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    framework: 'pytorch',
    architecture: 'resnet50',
    version: '1.0.0',
    inputSize: [224, 224, 3],
    numClasses: 1000,
    batchSize: 32,
    useGPU: true,
    learningRate: 0.001,
    optimizer: 'adam',
    epochs: 100,
    weightDecay: 0.0001,
    momentum: 0.9,
    scheduler: 'cosine',
    earlyStoppingEnabled: true,
    patience: 10,
    minDelta: 0.001,
    validationSplit: 0.2,
    randomSeed: 42,
  });

  const frameworks = [
    { value: 'pytorch', label: 'PyTorch' },
    { value: 'tensorflow', label: 'TensorFlow' },
    { value: 'jax', label: 'JAX' },
  ];

  const architectures = [
    { value: 'resnet50', label: 'ResNet50' },
    { value: 'vgg16', label: 'VGG16' },
    { value: 'efficientnet', label: 'EfficientNet' },
  ];

  const optimizers = [
    { value: 'adam', label: 'Adam' },
    { value: 'sgd', label: 'SGD' },
    { value: 'adamw', label: 'AdamW' },
  ];

  const schedulers = [
    { value: 'cosine', label: 'Cosine Annealing' },
    { value: 'step', label: 'Step' },
    { value: 'linear', label: 'Linear' },
  ];

  const mockModels = [
    {
      id: '1',
      name: 'ResNet50 Classifier',
      framework: 'PyTorch',
      architecture: 'ResNet50',
      version: '1.0.0',
      accuracy: 0.92,
      status: 'trained',
      updatedAt: '2024-03-15',
    },
    {
      id: '2',
      name: 'Object Detection v2',
      framework: 'TensorFlow',
      architecture: 'YOLO',
      version: '2.1.0',
      accuracy: 0.89,
      status: 'training',
      updatedAt: '2024-03-14',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Models</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Model
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Create New Model</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <Input
                  label="Name"
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={modelForm.description}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                />
                <Select
                  label="Framework"
                  options={frameworks}
                  value={modelForm.framework}
                  onChange={(value) => setModelForm({ ...modelForm, framework: value })}
                />
                <Select
                  label="Architecture"
                  options={architectures}
                  value={modelForm.architecture}
                  onChange={(value) => setModelForm({ ...modelForm, architecture: value })}
                />
                <Input
                  label="Version"
                  value={modelForm.version}
                  onChange={(e) => setModelForm({ ...modelForm, version: e.target.value })}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  {modelForm.inputSize.map((size, index) => (
                    <Input
                      key={index}
                      label={`Input Size ${index + 1}`}
                      type="number"
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...modelForm.inputSize];
                        newSizes[index] = parseInt(e.target.value);
                        setModelForm({ ...modelForm, inputSize: newSizes });
                      }}
                    />
                  ))}
                </div>
                <Input
                  label="Number of Classes"
                  type="number"
                  value={modelForm.numClasses}
                  onChange={(e) => setModelForm({ ...modelForm, numClasses: parseInt(e.target.value) })}
                />
                <Slider
                  label="Batch Size"
                  min={16}
                  max={128}
                  step={16}
                  value={modelForm.batchSize}
                  onChange={(value) => setModelForm({ ...modelForm, batchSize: value })}
                />
                <Switch
                  label="Use GPU"
                  checked={modelForm.useGPU}
                  onChange={(checked) => setModelForm({ ...modelForm, useGPU: checked })}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Hyperparameters</h3>
                <Slider
                  label="Learning Rate"
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={modelForm.learningRate}
                  onChange={(value) => setModelForm({ ...modelForm, learningRate: value })}
                />
                <Select
                  label="Optimizer"
                  options={optimizers}
                  value={modelForm.optimizer}
                  onChange={(value) => setModelForm({ ...modelForm, optimizer: value })}
                />
                <Slider
                  label="Epochs"
                  min={1}
                  max={500}
                  value={modelForm.epochs}
                  onChange={(value) => setModelForm({ ...modelForm, epochs: value })}
                />
                <Slider
                  label="Weight Decay"
                  min={0}
                  max={1}
                  step={0.0001}
                  value={modelForm.weightDecay}
                  onChange={(value) => setModelForm({ ...modelForm, weightDecay: value })}
                />
                <Slider
                  label="Momentum"
                  min={0}
                  max={1}
                  step={0.1}
                  value={modelForm.momentum}
                  onChange={(value) => setModelForm({ ...modelForm, momentum: value })}
                />
                <Select
                  label="Scheduler"
                  options={schedulers}
                  value={modelForm.scheduler}
                  onChange={(value) => setModelForm({ ...modelForm, scheduler: value })}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Early Stopping</h3>
                <Switch
                  label="Enable Early Stopping"
                  checked={modelForm.earlyStoppingEnabled}
                  onChange={(checked) => setModelForm({ ...modelForm, earlyStoppingEnabled: checked })}
                />
                {modelForm.earlyStoppingEnabled && (
                  <>
                    <Input
                      label="Patience"
                      type="number"
                      value={modelForm.patience}
                      onChange={(e) => setModelForm({ ...modelForm, patience: parseInt(e.target.value) })}
                    />
                    <Slider
                      label="Min Delta"
                      min={0}
                      max={1}
                      step={0.001}
                      value={modelForm.minDelta}
                      onChange={(value) => setModelForm({ ...modelForm, minDelta: value })}
                    />
                    <Slider
                      label="Validation Split"
                      min={0}
                      max={1}
                      step={0.1}
                      value={modelForm.validationSplit}
                      onChange={(value) => setModelForm({ ...modelForm, validationSplit: value })}
                    />
                    <Input
                      label="Random Seed"
                      type="number"
                      value={modelForm.randomSeed}
                      onChange={(e) => setModelForm({ ...modelForm, randomSeed: parseInt(e.target.value) })}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button>Create Model</Button>
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
                placeholder="Search models..."
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Architecture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {model.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.framework}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.architecture}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          model.status === 'trained'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};