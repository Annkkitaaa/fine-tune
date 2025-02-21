// src/pages/TrainingPage.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Loader2, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { useTraining } from '@/hooks/useTraining';
import { useTrainingUtils } from '@/hooks/useTrainingUtils';
import { useModels } from '@/hooks/useModels';
import { useDatasets } from '@/hooks/useDatasets';
import { MetricsVisualization } from '@/components/MetricsVisualization';
import { 
  OPTIMIZER_OPTIONS, 
  BATCH_SIZE_OPTIONS 
} from '@/lib/constants/training';

export const TrainingPage: React.FC = () => {
  const {
    trainings,
    trainingForm,
    loading,
    error,
    startTraining,
    stopTraining,
    updateTrainingForm,
    resetTrainingForm,
    refreshTrainings
  } = useTraining();

  const { models } = useModels();
  const { datasets } = useDatasets();
  const utils = useTrainingUtils();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewJob, setShowNewJob] = useState(false);

  const handleStartTraining = async () => {
    try {
      await startTraining();
      setShowNewJob(false);
      resetTrainingForm();
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const handleStopTraining = async (trainingId: number) => {
    try {
      await stopTraining(trainingId);
    } catch (error) {
      console.error('Failed to stop training:', error);
    }
  };

  const filteredTrainings = trainings.filter(training => {
    const modelName = models.find(m => m.value === training.model_id.toString())?.label || '';
    const datasetName = datasets.find(d => d.value === training.dataset_id.toString())?.label || '';
    const searchTerm = searchQuery.toLowerCase();
    
    return modelName.toLowerCase().includes(searchTerm) ||
           datasetName.toLowerCase().includes(searchTerm);
  });

  if (loading && !trainings.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Training Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshTrainings}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowNewJob(!showNewJob)}>
            <Play className="w-4 h-4 mr-2" />
            New Training Job
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showNewJob && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Create Training Job</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="Model"
                  options={models}
                  value={trainingForm.modelId}
                  onChange={(value) => updateTrainingForm({ modelId: value })}
                />
                <Select
                  label="Dataset"
                  options={datasets}
                  value={trainingForm.datasetId}
                  onChange={(value) => updateTrainingForm({ datasetId: value })}
                />
                <Input
                  label="Learning Rate"
                  type="number"
                  min="0.0001"
                  max="1"
                  step="0.0001"
                  value={trainingForm.hyperparameters.learning_rate}
                  onChange={(e) => updateTrainingForm({
                    hyperparameters: {
                      ...trainingForm.hyperparameters,
                      learning_rate: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
              <div className="space-y-4">
                <Select
                  label="Batch Size"
                  options={BATCH_SIZE_OPTIONS}
                  value={trainingForm.hyperparameters.batch_size.toString()}
                  onChange={(value) => updateTrainingForm({
                    hyperparameters: {
                      ...trainingForm.hyperparameters,
                      batch_size: parseInt(value)
                    }
                  })}
                />
                <Input
                  label="Epochs"
                  type="number"
                  min="1"
                  max="1000"
                  value={trainingForm.hyperparameters.epochs}
                  onChange={(e) => updateTrainingForm({
                    hyperparameters: {
                      ...trainingForm.hyperparameters,
                      epochs: parseInt(e.target.value)
                    }
                  })}
                />
                <Select
                  label="Optimizer"
                  options={OPTIMIZER_OPTIONS}
                  value={trainingForm.hyperparameters.optimizer.name}
                  onChange={(value) => updateTrainingForm({
                    hyperparameters: {
                      ...trainingForm.hyperparameters,
                      optimizer: {
                        ...trainingForm.hyperparameters.optimizer,
                        name: value
                      }
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowNewJob(false);
                  resetTrainingForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartTraining}
                disabled={loading || !trainingForm.modelId || !trainingForm.datasetId}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Training'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Training Progress</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <MetricsVisualization
                type="line"
                data={trainings.map(t => ({
                  name: models.find(m => m.value === t.model_id.toString())?.label || '',
                  progress: utils.calculateProgress(t)
                }))}
                title="Training Progress"
                xKey="name"
                yKey="progress"
                height={300}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Loss & Accuracy</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <MetricsVisualization
                type="line"
                data={trainings.filter(t => t.metrics).map(t => ({
                  name: models.find(m => m.value === t.model_id.toString())?.label || '',
                  loss: t.metrics?.loss || 0,
                  accuracy: t.metrics?.accuracy || 0
                }))}
                title="Training Metrics"
                xKey="name"
                yKey="accuracy"
                height={300}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Jobs List */}
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
            {filteredTrainings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No training jobs found. {searchQuery ? 'Try a different search term.' : 'Start your first training job!'}
                </p>
              </div>
            ) : (
              filteredTrainings.map((training) => (
                <div
                  key={training.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        {models.find(m => m.value === training.model_id.toString())?.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dataset: {datasets.find(d => d.value === training.dataset_id.toString())?.label}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${utils.getStatusColor(
                          training.status
                        )}`}
                      >
                        {training.status}
                      </span>
                      {training.status === 'running' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStopTraining(training.id)}
                          disabled={loading}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {training.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{utils.calculateProgress(training)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${utils.calculateProgress(training)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {training.metrics && (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>{' '}
                          {utils.formatPercentage(training.metrics.accuracy)}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Loss:</span>{' '}
                          {utils.formatMetric(training.metrics.loss)}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Duration:</span>{' '}
                          {utils.formatDuration(training.duration)}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Time Remaining:</span>{' '}
                          {utils.getTimeRemaining(training) || '-'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Resource Usage */}
                  {training.status === 'running' && training.metrics && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">CPU Usage:</span>{' '}
                        {utils.formatPercentage(training.metrics.cpu_usage || 0)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Memory Usage:</span>{' '}
                        {utils.formatPercentage(training.metrics.memory_usage || 0)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">GPU Usage:</span>{' '}
                        {utils.formatPercentage(training.metrics.gpu_usage || 0)}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {training.error_message && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{training.error_message}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPage;