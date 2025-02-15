import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Search, Play, Pause, Filter } from 'lucide-react';

export const TrainingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewJob, setShowNewJob] = useState(false);
  const [trainingForm, setTrainingForm] = useState({
    modelId: '',
    datasetId: '',
  });

  const mockModels = [
    { value: 'model1', label: 'ResNet50 Classifier' },
    { value: 'model2', label: 'Object Detection v2' },
  ];

  const mockDatasets = [
    { value: 'dataset1', label: 'ImageNet Subset' },
    { value: 'dataset2', label: 'Sensor Data' },
  ];

  const mockJobs = [
    {
      id: '1',
      model: 'ResNet50 Classifier',
      dataset: 'ImageNet Subset',
      status: 'running',
      progress: 65,
      accuracy: 0.89,
      loss: 0.23,
      startedAt: '2024-03-15 10:30',
      eta: '2h 30m',
    },
    {
      id: '2',
      model: 'Object Detection v2',
      dataset: 'Sensor Data',
      status: 'completed',
      progress: 100,
      accuracy: 0.92,
      loss: 0.18,
      startedAt: '2024-03-14 15:45',
      eta: '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Training Jobs</h1>
        <Button onClick={() => setShowNewJob(!showNewJob)}>
          <Play className="w-4 h-4 mr-2" />
          New Training Job
        </Button>
      </div>

      {showNewJob && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Create Training Job</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Model"
                options={mockModels}
                value={trainingForm.modelId}
                onChange={(value) => setTrainingForm({ ...trainingForm, modelId: value })}
              />
              <Select
                label="Dataset"
                options={mockDatasets}
                value={trainingForm.datasetId}
                onChange={(value) => setTrainingForm({ ...trainingForm, datasetId: value })}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowNewJob(false)}>
                Cancel
              </Button>
              <Button>Start Training</Button>
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
                placeholder="Search training jobs..."
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
            {mockJobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{job.model}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dataset: {job.dataset}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        job.status === 'running'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.status === 'running' && (
                      <Button size="sm" variant="secondary">
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>{ } {job.accuracy.toFixed(3)}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Loss:</span>{' '}
                      {job.loss.toFixed(3)}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Started:</span>{' '}
                      {job.startedAt}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">ETA:</span>{' '}
                      {job.eta}
                    </div>
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