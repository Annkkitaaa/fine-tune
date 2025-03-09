// src/pages/TrainingPage.tsx
import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Zap
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
    directStartTraining,
    stopTraining,
    updateTrainingForm,
    resetTrainingForm,
    refreshTrainings
  } = useTraining();

  const { models, loading: modelsLoading, fetchModels } = useModels();
  const { datasets, loading: datasetsLoading, fetchDatasets } = useDatasets();
  const utils = useTrainingUtils();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewJob, setShowNewJob] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fetch models and datasets on component mount
  useEffect(() => {
    console.log("Component mounted - fetching initial data");
    fetchModels();
    fetchDatasets();
  }, [fetchModels, fetchDatasets]);

  // Log the values of the form whenever they change
  useEffect(() => {
    console.log("Form state changed:", {
      modelId: trainingForm.modelId,
      datasetId: trainingForm.datasetId,
      isModelSelected: Boolean(trainingForm.modelId),
      isDatasetSelected: Boolean(trainingForm.datasetId)
    });
  }, [trainingForm]);

  const handleStartTraining = async () => {
    console.log("Start training button clicked");
    setLocalError(null);
    
    // Validate form
    if (!trainingForm.modelId) {
      setLocalError("Please select a model");
      return;
    }
    
    if (!trainingForm.datasetId) {
      setLocalError("Please select a dataset");
      return;
    }
    
    try {
      setLocalLoading(true);
      
      console.log("Form data being sent:", {
        modelId: trainingForm.modelId,
        datasetId: trainingForm.datasetId,
        hyperparameters: trainingForm.hyperparameters
      });

      await startTraining();
      console.log("Training started successfully");
      
      // Reset form and close panel
      setShowNewJob(false);
      resetTrainingForm();
    } catch (error) {
      console.error("Error starting training:", error);
      setLocalError(error instanceof Error ? error.message : 'Failed to start training');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDirectStart = async () => {
    console.log("Direct start button clicked");
    setLocalError(null);
    
    try {
      setLocalLoading(true);
      await directStartTraining();
      console.log("Direct training start succeeded");
      
      // Reset form and close panel
      setShowNewJob(false);
      resetTrainingForm();
    } catch (error) {
      console.error("Error with direct start:", error);
      setLocalError(error instanceof Error ? error.message : 'Failed to start training');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleStopTraining = async (trainingId: number) => {
    try {
      setLocalLoading(true);
      await stopTraining(trainingId);
    } catch (error) {
      console.error("Error stopping training:", error);
      setLocalError(error instanceof Error ? error.message : 'Failed to stop training');
    } finally {
      setLocalLoading(false);
    }
  };

  // Convert models and datasets to select options
  const modelOptions = React.useMemo(() => {
    if (!models || !Array.isArray(models)) return [];
    return models.map(model => ({
      value: String(model.id),
      label: model.name || `Model ${model.id}`
    }));
  }, [models]);

  const datasetOptions = React.useMemo(() => {
    if (!datasets || !Array.isArray(datasets)) return [];
    return datasets.map(dataset => ({
      value: String(dataset.id),
      label: dataset.name || `Dataset ${dataset.id}`
    }));
  }, [datasets]);

  // Filter trainings based on search query
  const filteredTrainings = React.useMemo(() => {
    if (!searchQuery || !trainings || !Array.isArray(trainings)) return trainings || [];
    
    const searchTerm = searchQuery.toLowerCase();
    return trainings.filter(training => {
      const modelName = modelOptions.find(m => m.value === training.model_id.toString())?.label || '';
      const datasetName = datasetOptions.find(d => d.value === training.dataset_id.toString())?.label || '';
      
      return modelName.toLowerCase().includes(searchTerm) ||
             datasetName.toLowerCase().includes(searchTerm);
    });
  }, [trainings, searchQuery, modelOptions, datasetOptions]);

  // Determine if the form is ready for submission
  const isFormValid = Boolean(trainingForm.modelId) && Boolean(trainingForm.datasetId);
  const isSubmitDisabled = loading || localLoading || !isFormValid;

  // Show loading state
  if ((loading && !trainings?.length) || modelsLoading || datasetsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Loading training dashboard...</p>
        </div>
      </div>
    );
  }

  // Log debug information
  console.log("Rendering TrainingPage with:", {
    modelOptionsCount: modelOptions.length,
    datasetOptionsCount: datasetOptions.length,
    trainingsCount: trainings?.length || 0,
    isFormValid,
    isSubmitDisabled
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Training Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshTrainings}
            disabled={loading || localLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || localLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowNewJob(!showNewJob)}>
            <Play className="w-4 h-4 mr-2" />
            New Training Job
          </Button>
        </div>
      </div>

      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
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
                  options={modelOptions}
                  value={trainingForm.modelId}
                  onChange={(value) => {
                    console.log("Model selected:", value);
                    updateTrainingForm({ modelId: value });
                  }}
                />
                <Select
                  label="Dataset"
                  options={datasetOptions}
                  value={trainingForm.datasetId}
                  onChange={(value) => {
                    console.log("Dataset selected:", value);
                    updateTrainingForm({ datasetId: value });
                  }}
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
              
              {/* Primary Start Training Button - Fixed to not be disabled when valid */}
              <Button
                onClick={handleStartTraining}
                disabled={isSubmitDisabled}
                style={{
                  backgroundColor: isFormValid ? '#3b82f6' : '#94a3b8',
                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
              >
                {(loading || localLoading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Training'
                )}
              </Button>
              
              {/* Emergency direct method button */}
              <Button
                onClick={handleDirectStart}
                disabled={isSubmitDisabled}
                style={{
                  backgroundColor: isFormValid ? '#dc2626' : '#94a3b8',
                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Emergency Start
              </Button>
            </div>
            
            {/* Debug info */}
            <div className="mt-4 text-xs text-gray-500 border-t pt-2">
              <p>Debug info:</p>
              <p>Model ID: {trainingForm.modelId || 'none'}</p>
              <p>Dataset ID: {trainingForm.datasetId || 'none'}</p>
              <p>Form valid: {isFormValid ? 'Yes' : 'No'}</p>
              <p>Button disabled: {isSubmitDisabled ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics - Only show if there are trainings */}
      {trainings && trainings.length > 0 && (
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
                    name: modelOptions.find(m => m.value === t.model_id.toString())?.label || `Model ${t.model_id}`,
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
                    name: modelOptions.find(m => m.value === t.model_id.toString())?.label || `Model ${t.model_id}`,
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
      )}

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
            {(!filteredTrainings || filteredTrainings.length === 0) ? (
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
                        {modelOptions.find(m => m.value === training.model_id.toString())?.label || `Model ${training.model_id}`}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dataset: {datasetOptions.find(d => d.value === training.dataset_id.toString())?.label || `Dataset ${training.dataset_id}`}
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
                          disabled={loading || localLoading}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(training.status === 'running' || training.status === 'queued') && (
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
                        {utils.formatPercentage(training.metrics.cpu_usage)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Memory Usage:</span>{' '}
                        {utils.formatPercentage(training.metrics.memory_usage)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">GPU Usage:</span>{' '}
                        {utils.formatPercentage(training.metrics.gpu_usage)}
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