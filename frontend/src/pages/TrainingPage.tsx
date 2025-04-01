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
  Zap,
  ChevronDown,
  ChevronUp,
  Server,
  Cpu,
  Database
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
import { Training } from '@/types/training.types';

export const TrainingPage: React.FC = () => {
  const {
    trainings,
    trainingForm,
    loading,
    error,
    createTraining,
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
  
  // State for expanded training details
  const [expandedTrainingId, setExpandedTrainingId] = useState<number | null>(null);

  // Fetch models and datasets on component mount
  useEffect(() => {
    console.log("Component mounted - fetching initial data");
    fetchModels();
    fetchDatasets();
  }, [fetchModels, fetchDatasets]);

  // Auto-refresh training data every 5 seconds when there are active trainings
  useEffect(() => {
    const activeTrainings = trainings?.filter(t => 
      t.status === 'running' || t.status === 'queued'
    );
    
    if (activeTrainings && activeTrainings.length > 0) {
      const interval = setInterval(() => {
        refreshTrainings();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [trainings, refreshTrainings]);

  // Log the values of the form whenever they change
  useEffect(() => {
    console.log("Form state changed:", {
      modelId: trainingForm?.modelId,
      datasetId: trainingForm?.datasetId,
      isModelSelected: Boolean(trainingForm?.modelId),
      isDatasetSelected: Boolean(trainingForm?.datasetId)
    });
  }, [trainingForm]);

  const handleStartTraining = async () => {
    console.log("Start training button clicked");
    setLocalError(null);
    
    // Validate form
    if (!trainingForm?.modelId) {
      setLocalError("Please select a model");
      return;
    }
    
    if (!trainingForm?.datasetId) {
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

      await createTraining();
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

  const handleStopTraining = async (trainingId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card expansion when clicking stop button
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

  // Toggle expanded state of a training job
  const toggleTrainingExpanded = (trainingId: number) => {
    setExpandedTrainingId(prevId => 
      prevId === trainingId ? null : trainingId
    );
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
      const modelName = modelOptions.find(m => m.value === String(training.model_id))?.label || '';
      const datasetName = datasetOptions.find(d => d.value === String(training.dataset_id))?.label || '';
      
      return modelName.toLowerCase().includes(searchTerm) ||
             datasetName.toLowerCase().includes(searchTerm);
    });
  }, [trainings, searchQuery, modelOptions, datasetOptions]);

  // Determine if the form is ready for submission
  const isFormValid = Boolean(trainingForm?.modelId) && Boolean(trainingForm?.datasetId);
  const isSubmitDisabled = loading || localLoading || !isFormValid;

  // Render training details when expanded
  const renderTrainingDetails = (training: Training) => {
    const modelName = modelOptions.find(m => m.value === String(training.model_id))?.label || `Model ${training.model_id}`;
    const datasetName = datasetOptions.find(d => d.value === String(training.dataset_id))?.label || `Dataset ${training.dataset_id}`;
    
    // Prepare history data for charts
    const historyData = utils.prepareHistoryChartData(training);
    
    return (
      <div className="mt-4 space-y-4 border-t pt-4">
        {/* Charts */}
        {historyData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-md font-medium">Training Loss</h3>
              </CardHeader>
              <CardContent>
                <MetricsVisualization
                  type="line"
                  data={historyData}
                  title="Loss Over Time"
                  xKey="epoch"
                  yKey="train_loss"
                  height={200}
                />
              </CardContent>
            </Card>
            
            {training.metrics?.history?.val_loss && (
              <Card>
                <CardHeader>
                  <h3 className="text-md font-medium">Validation Loss</h3>
                </CardHeader>
                <CardContent>
                  <MetricsVisualization
                    type="line"
                    data={historyData}
                    title="Validation Loss"
                    xKey="epoch"
                    yKey="val_loss"
                    height={200}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Resource Metrics */}
        {training.status === 'running' && training.metrics && (
          <Card>
            <CardHeader>
              <h3 className="text-md font-medium">Resource Usage</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">CPU Usage</p>
                    <p className="font-medium">{utils.formatPercentage(training.metrics.cpu_usage)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Database Usage</p>
                    <p className="font-medium">{utils.formatPercentage(training.metrics.Database_usage)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">GPU Usage</p>
                    <p className="font-medium">{utils.formatPercentage(training.metrics.gpu_usage)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Hyperparameters */}
        <Card>
          <CardHeader>
            <h3 className="text-md font-medium">Hyperparameters</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Learning Rate</p>
                <p className="font-medium">{training.hyperparameters?.learning_rate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Batch Size</p>
                <p className="font-medium">{training.hyperparameters?.batch_size}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Epochs</p>
                <p className="font-medium">{training.hyperparameters?.epochs}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Optimizer</p>
                <p className="font-medium">{training.hyperparameters?.optimizer?.name?.toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Timing Information */}
        <Card>
          <CardHeader>
            <h3 className="text-md font-medium">Timing Information</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Started At</p>
                <p className="font-medium">
                  {training.start_time ? new Date(training.start_time).toLocaleString() : 'Not started'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium">{utils.formatDuration(training.duration)}</p>
              </div>
              {training.status === 'running' && (
                <div>
                  <p className="text-xs text-gray-500">Estimated Completion</p>
                  <p className="font-medium">{utils.getEstimatedCompletionTime(training)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Error Message */}
        {training.error_message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{training.error_message}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

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

      {showNewJob && trainingForm && (
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
                  value={trainingForm.modelId || ''}
                  onChange={(value) => {
                    console.log("Model selected:", value);
                    updateTrainingForm({ modelId: value });
                  }}
                />
                <Select
                  label="Dataset"
                  options={datasetOptions}
                  value={trainingForm.datasetId || ''}
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
                  value={trainingForm.hyperparameters?.learning_rate || 0.001}
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
                  value={String(trainingForm.hyperparameters?.batch_size || 32)}
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
                  value={trainingForm.hyperparameters?.epochs || 10}
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
                  value={trainingForm.hyperparameters?.optimizer?.name || 'adam'}
                  onChange={(value) => updateTrainingForm({
                    hyperparameters: {
                      ...trainingForm.hyperparameters,
                      optimizer: {
                        ...(trainingForm.hyperparameters?.optimizer || {}),
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
                    name: modelOptions.find(m => m.value === String(t.model_id))?.label || `Model ${t.model_id}`,
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
                    name: modelOptions.find(m => m.value === String(t.model_id))?.label || `Model ${t.model_id}`,
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
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer transition-colors"
            onClick={() => toggleTrainingExpanded(training.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium">
                    {modelOptions.find(m => m.value === String(training.model_id))?.label || `Model ${training.model_id}`}
                  </h3>
                  {expandedTrainingId === training.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dataset: {datasetOptions.find(d => d.value === String(training.dataset_id))?.label || `Dataset ${training.dataset_id}`}
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
                    onClick={(e) => handleStopTraining(training.id, e)}
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
                  <span>
                    {training.epochs_completed || 0}/{training.epochs_total || training.hyperparameters?.epochs || 0} epochs 
                    ({utils.calculateProgress(training)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${utils.calculateProgress(training)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Basic Metrics Grid - Always visible */}
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

            {/* Resource Usage - Only visible when running */}
            {training.status === 'running' && training.metrics && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">CPU Usage:</span>{' '}
                  {utils.formatPercentage(training.metrics.cpu_usage)}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Database Usage:</span>{' '}
                  {utils.formatPercentage(training.metrics.Database_usage)}
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

            {/* Expanded Details */}
            {expandedTrainingId === training.id && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold mb-4">Training Details</h4>
                
                {/* Detailed Charts */}
                {training.metrics?.history && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardHeader>
                        <h5 className="text-sm font-medium">Training Loss</h5>
                      </CardHeader>
                      <CardContent className="h-48">
                        <MetricsVisualization
                          type="line"
                          data={utils.prepareHistoryChartData(training)}
                          title="Loss Over Time"
                          xKey="epoch"
                          yKey="train_loss"
                          height={150}
                        />
                      </CardContent>
                    </Card>
                    
                    {training.metrics.history.val_loss && (
                      <Card>
                        <CardHeader>
                          <h5 className="text-sm font-medium">Validation Loss</h5>
                        </CardHeader>
                        <CardContent className="h-48">
                          <MetricsVisualization
                            type="line"
                            data={utils.prepareHistoryChartData(training)}
                            title="Validation Loss"
                            xKey="epoch"
                            yKey="val_loss"
                            height={150}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {/* Hyperparameters */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Hyperparameters</h5>
                    <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Learning Rate:</span>{' '}
                        {training.hyperparameters?.learning_rate}
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Batch Size:</span>{' '}
                        {training.hyperparameters?.batch_size}
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Epochs:</span>{' '}
                        {training.hyperparameters?.epochs}
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Optimizer:</span>{' '}
                        {training.hyperparameters?.optimizer?.name?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Timing Information</h5>
                    <div className="grid grid-cols-1 gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Started:</span>{' '}
                        {training.start_time ? new Date(training.start_time).toLocaleString() : 'Not started'}
                      </div>
                      {training.end_time && (
                        <div className="text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>{' '}
                          {new Date(training.end_time).toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Total Duration:</span>{' '}
                        {utils.formatDuration(training.duration)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Actions */}
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTrainingId(null);
                    }}
                  >
                    Close Details
                  </Button>
                  
                  {training.status === 'completed' && (
                    <Button size="sm" variant="default">
                      Download Model
                    </Button>
                  )}
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