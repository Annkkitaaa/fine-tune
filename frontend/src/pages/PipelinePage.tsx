import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';
import { GitBranch, Play, Clock, AlertCircle } from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const [pipelineForm, setPipelineForm] = useState({
    datasetId: '',
    enableCorrelation: true,
    enableFeatureImportance: true,
    enableVisualization: true,
    augmentationMethod: 'none',
    augmentationFactor: 0.5,
    randomState: 42,
  });

  const mockDatasets = [
    { value: 'dataset1', label: 'ImageNet Subset' },
    { value: 'dataset2', label: 'Sensor Data' },
  ];

  const augmentationMethods = [
    { value: 'none', label: 'None' },
    { value: 'rotation', label: 'Rotation' },
    { value: 'flip', label: 'Flip' },
    { value: 'noise', label: 'Noise' },
  ];

  const mockPipelines = [
    {
      id: '1',
      name: 'Image Classification Pipeline',
      status: 'running',
      progress: 75,
      startTime: '10:30 AM',
      duration: '45m',
      errors: 0,
    },
    {
      id: '2',
      name: 'Data Preprocessing Pipeline',
      status: 'completed',
      progress: 100,
      startTime: '09:15 AM',
      duration: '1h 30m',
      errors: 2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ML Pipelines</h1>
        <Button>
          <GitBranch className="w-4 h-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Pipeline Configuration</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Select
                label="Dataset"
                options={mockDatasets}
                value={pipelineForm.datasetId}
                onChange={(value) => setPipelineForm({ ...pipelineForm, datasetId: value })}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Analysis Settings</h3>
                <Switch
                  label="Correlation Analysis"
                  checked={pipelineForm.enableCorrelation}
                  onChange={(checked) =>
                    setPipelineForm({ ...pipelineForm, enableCorrelation: checked })
                  }
                />
                <Switch
                  label="Feature Importance"
                  checked={pipelineForm.enableFeatureImportance}
                  onChange={(checked) =>
                    setPipelineForm({ ...pipelineForm, enableFeatureImportance: checked })
                  }
                />
                <Switch
                  label="Generate Visualizations"
                  checked={pipelineForm.enableVisualization}
                  onChange={(checked) =>
                    setPipelineForm({ ...pipelineForm, enableVisualization: checked })
                  }
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Augmentation Settings</h3>
                <Select
                  label="Method"
                  options={augmentationMethods}
                  value={pipelineForm.augmentationMethod}
                  onChange={(value) =>
                    setPipelineForm({ ...pipelineForm, augmentationMethod: value })
                  }
                />
                {pipelineForm.augmentationMethod !== 'none' && (
                  <Slider
                    label="Augmentation Factor"
                    min={0}
                    max={1}
                    step={0.1}
                    value={pipelineForm.augmentationFactor}
                    onChange={(value) =>
                      setPipelineForm({ ...pipelineForm, augmentationFactor: value })
                    }
                  />
                )}
              </div>

              <div className="flex justify-end">
                <Button>Run Pipeline</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Pipeline Status</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{pipeline.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pipeline.status === 'running'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {pipeline.status}
                        </span>
                        {pipeline.status === 'running' && (
                          <Button size="sm" variant="secondary">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{pipeline.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pipeline.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{pipeline.startTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{pipeline.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span>{pipeline.errors} errors</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};