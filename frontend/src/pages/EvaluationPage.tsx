// src/pages/EvaluationPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Loader2, 
  LineChart, 
  BarChart2, 
  AlertCircle,
  RefreshCw,
  FilterX,
  Calendar,
  Clock,
  Cpu,
  Database,
  Activity,
  Target
} from 'lucide-react';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useModels } from '@/hooks/useModels';
import { useDatasets } from '@/hooks/useDatasets';
import { MetricsVisualization } from '@/components/MetricsVisualization';
import { ConfusionMatrix } from '@/components/ConfusionMatrix';

export const EvaluationPage: React.FC = () => {
  const {
    evaluations,
    evaluationForm,
    loading,
    error,
    fetchEvaluations,
    startEvaluation,
    updateEvaluationForm,
    resetEvaluationForm,
  } = useEvaluation();

  const { models, loading: modelsLoading, fetchModels } = useModels();
  const { datasets, loading: datasetsLoading, fetchDatasets } = useDatasets();
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState('overview');
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Format models and datasets for Select component
  const modelOptions = models?.map(model => ({
    label: model.name || `Model #${model.id}`,
    value: model.id.toString()
  })) || [];

  const datasetOptions = datasets?.map(dataset => ({
    label: dataset.name || `Dataset #${dataset.id}`,
    value: dataset.id.toString()
  })) || [];

  useEffect(() => {
    // Load initial data
    fetchEvaluations();
    fetchModels();
    fetchDatasets();
  }, [fetchEvaluations, fetchModels, fetchDatasets]);

  // Set the first evaluation as selected when data loads
  useEffect(() => {
    if (evaluations.length > 0 && !selectedEvaluationId) {
      setSelectedEvaluationId(evaluations[0].id);
    }
  }, [evaluations, selectedEvaluationId]);

  const handleStartEvaluation = async () => {
    try {
      setEvaluationError(null);
      const result = await startEvaluation();
      setSelectedEvaluationId(result.id);
      resetEvaluationForm();
    } catch (error) {
      console.error('Failed to start evaluation:', error);
      setEvaluationError(error instanceof Error ? error.message : 'Failed to start evaluation');
    }
  };

  const renderFeatureImportance = (importance: Record<string, number> | undefined) => {
    if (!importance) return <p>No feature importance data available</p>;

    const data = Object.entries(importance)
      .map(([feature, value]) => ({
        feature,
        importance: value
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // Show top 10 features

    return (
      <MetricsVisualization
        type="bar"
        data={data}
        title="Feature Importance"
        xKey="feature"
        yKey="importance"
        height={300}
      />
    );
  };

  const getSelectedEvaluation = () => {
    if (!selectedEvaluationId) return null;
    return evaluations.find(e => e.id === selectedEvaluationId) || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Helper to determine if we're dealing with a classification model
  const isClassificationModel = (evaluation: any) => {
    // Check if classification metrics exist
    return evaluation.metrics.accuracy !== undefined || 
           evaluation.metrics.precision !== undefined || 
           evaluation.metrics.recall !== undefined || 
           evaluation.metrics.f1_score !== undefined;
  };

  // Helper to determine if we're dealing with a regression model
  const isRegressionModel = (evaluation: any) => {
    // Check if regression metrics exist
    return evaluation.metrics.mse !== undefined || 
           evaluation.metrics.rmse !== undefined || 
           evaluation.metrics.mae !== undefined || 
           evaluation.metrics.r2 !== undefined;
  };

  if (loading && !evaluations.length) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  const selectedEvaluation = getSelectedEvaluation();

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Model Evaluation</h1>
        <Button 
          variant="outline" 
          onClick={fetchEvaluations}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Evaluation Configuration</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <Select
                  label="Model"
                  options={modelOptions}
                  value={evaluationForm.modelId}
                  onChange={(value) => updateEvaluationForm({ modelId: value })}
                  isLoading={modelsLoading}
                  placeholder="Select a model"
                />
                <Select
                  label="Dataset"
                  options={datasetOptions}
                  value={evaluationForm.datasetId}
                  onChange={(value) => updateEvaluationForm({ datasetId: value })}
                  isLoading={datasetsLoading}
                  placeholder="Select a dataset"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Classification metrics */}
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium mb-2 text-gray-500">Classification Metrics</h4>
                  </div>
                  <Switch
                    label="ACCURACY"
                    checked={evaluationForm.metrics.accuracy}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, accuracy: checked }
                    })}
                  />
                  <Switch
                    label="PRECISION"
                    checked={evaluationForm.metrics.precision}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, precision: checked }
                    })}
                  />
                  <Switch
                    label="RECALL"
                    checked={evaluationForm.metrics.recall}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, recall: checked }
                    })}
                  />
                  <Switch
                    label="F1 SCORE"
                    checked={evaluationForm.metrics.f1_score}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, f1_score: checked }
                    })}
                  />
                  
                  {/* Regression metrics */}
                  <div className="col-span-2 mt-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-500">Regression Metrics</h4>
                  </div>
                  <Switch
                    label="MSE"
                    checked={evaluationForm.metrics.mse}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, mse: checked }
                    })}
                  />
                  <Switch
                    label="RMSE"
                    checked={evaluationForm.metrics.rmse}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, rmse: checked }
                    })}
                  />
                  <Switch
                    label="MAE"
                    checked={evaluationForm.metrics.mae}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, mae: checked }
                    })}
                  />
                  <Switch
                    label="R²"
                    checked={evaluationForm.metrics.r2}
                    onChange={(checked) => updateEvaluationForm({
                      metrics: { ...evaluationForm.metrics, r2: checked }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Parameters</h3>
                <Slider
                  label="Test Split"
                  min={0.1}
                  max={0.4}
                  step={0.05}
                  value={evaluationForm.parameters.test_split}
                  onChange={(value) => updateEvaluationForm({
                    parameters: { ...evaluationForm.parameters, test_split: value }
                  })}
                />
                <Input
                  label="Random Seed"
                  type="number"
                  value={evaluationForm.parameters.random_seed.toString()}
                  onChange={(e) => updateEvaluationForm({
                    parameters: { ...evaluationForm.parameters, random_seed: parseInt(e.target.value) }
                  })}
                />
                <Slider
                  label="Classification Threshold"
                  min={0}
                  max={1}
                  step={0.05}
                  value={evaluationForm.parameters.threshold}
                  onChange={(value) => updateEvaluationForm({
                    parameters: { ...evaluationForm.parameters, threshold: value }
                  })}
                />
              </div>

              {evaluationError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{evaluationError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={resetEvaluationForm}
                  disabled={loading}
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleStartEvaluation}
                  disabled={loading || !evaluationForm.modelId || !evaluationForm.datasetId}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    'Evaluate Model'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">Evaluation Results</h2>
            {evaluations.length > 0 && (
              <Select
                label=""
                options={evaluations.map(e => ({ 
                  label: `Evaluation #${e.id} (${new Date(e.created_at).toLocaleDateString()})`, 
                  value: e.id.toString() 
                }))}
                value={selectedEvaluationId ? selectedEvaluationId.toString() : ''}
                onChange={(value) => setSelectedEvaluationId(parseInt(value))}
                placeholder="Select evaluation"
              />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {evaluations.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-500">
                    No evaluations found. Start by evaluating a model!
                  </p>
                </div>
              ) : selectedEvaluation ? (
                <div>
                  {/* Dynamic navigation buttons based on available metrics */}
                  <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                    <Button 
                      variant={activeView === 'overview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('overview')}
                    >
                      Overview
                    </Button>
                    <Button 
                      variant={activeView === 'metrics' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('metrics')}
                    >
                      Metrics
                    </Button>
                    {isClassificationModel(selectedEvaluation) && selectedEvaluation.confusion_matrix && (
                      <Button 
                        variant={activeView === 'confusion' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('confusion')}
                      >
                        Confusion Matrix
                      </Button>
                    )}
                    {selectedEvaluation.metrics.feature_importance && (
                      <Button 
                        variant={activeView === 'features' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('features')}
                      >
                        Feature Importance
                      </Button>
                    )}
                  </div>

                  {/* Overview View */}
                  {activeView === 'overview' && (
                    <div className="space-y-6">
                      {/* Classification metrics if available */}
                      {isClassificationModel(selectedEvaluation) && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedEvaluation.metrics.accuracy !== undefined && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <h3 className="font-medium">Accuracy</h3>
                              </div>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {(selectedEvaluation.metrics.accuracy * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {selectedEvaluation.metrics.f1_score !== undefined && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="w-5 h-5 text-green-500" />
                                <h3 className="font-medium">F1 Score</h3>
                              </div>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(selectedEvaluation.metrics.f1_score * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Regression metrics if available */}
                      {isRegressionModel(selectedEvaluation) && !isClassificationModel(selectedEvaluation) && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedEvaluation.metrics.r2 !== undefined && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <h3 className="font-medium">R² Score</h3>
                              </div>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {selectedEvaluation.metrics.r2.toFixed(4)}
                              </p>
                            </div>
                          )}
                          {selectedEvaluation.metrics.rmse !== undefined && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="w-5 h-5 text-green-500" />
                                <h3 className="font-medium">RMSE</h3>
                              </div>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {selectedEvaluation.metrics.rmse.toFixed(4)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-500">
                              <Cpu className="w-4 h-4 mr-1" />
                              Model:
                            </span>
                            <span className="font-medium">
                              {modelOptions.find(m => m.value === selectedEvaluation.model_id.toString())?.label || 
                                `Model #${selectedEvaluation.model_id}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-500">
                              <Database className="w-4 h-4 mr-1" />
                              Dataset:
                            </span>
                            <span className="font-medium">
                              {datasetOptions.find(d => d.value === selectedEvaluation.dataset_id.toString())?.label || 
                                `Dataset #${selectedEvaluation.dataset_id}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              Execution Time:
                            </span>
                            <span className="font-medium">{selectedEvaluation.execution_time.toFixed(2)}s</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {isClassificationModel(selectedEvaluation) && (
                            <>
                              {selectedEvaluation.metrics.precision !== undefined && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Precision:</span>
                                  <span className="font-medium">
                                    {(selectedEvaluation.metrics.precision * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {selectedEvaluation.metrics.recall !== undefined && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Recall:</span>
                                  <span className="font-medium">
                                    {(selectedEvaluation.metrics.recall * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              Date:
                            </span>
                            <span className="font-medium">{formatDate(selectedEvaluation.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Regression metrics detailed display */}
                      {isRegressionModel(selectedEvaluation) && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Regression Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedEvaluation.metrics.mse !== undefined && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">MSE:</div>
                                <div className="font-medium">{selectedEvaluation.metrics.mse.toFixed(4)}</div>
                              </div>
                            )}
                            {selectedEvaluation.metrics.rmse !== undefined && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">RMSE:</div>
                                <div className="font-medium">{selectedEvaluation.metrics.rmse.toFixed(4)}</div>
                              </div>
                            )}
                            {selectedEvaluation.metrics.mae !== undefined && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">MAE:</div>
                                <div className="font-medium">{selectedEvaluation.metrics.mae.toFixed(4)}</div>
                              </div>
                            )}
                            {selectedEvaluation.metrics.r2 !== undefined && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">R²:</div>
                                <div className="font-medium">{selectedEvaluation.metrics.r2.toFixed(4)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metrics View */}
                  {activeView === 'metrics' && (
                    <div className="space-y-6">
                      {/* Classification metrics visualization */}
                      {isClassificationModel(selectedEvaluation) && (
                        <MetricsVisualization
                          type="bar"
                          data={[
                            { metric: 'Accuracy', value: selectedEvaluation.metrics.accuracy || 0 },
                            { metric: 'Precision', value: selectedEvaluation.metrics.precision || 0 },
                            { metric: 'Recall', value: selectedEvaluation.metrics.recall || 0 },
                            { metric: 'F1 Score', value: selectedEvaluation.metrics.f1_score || 0 },
                          ].filter(item => item.value !== 0)}
                          title="Classification Metrics"
                          xKey="metric"
                          yKey="value"
                          height={300}
                        />
                      )}

                      {/* Regression metrics visualization */}
                      {isRegressionModel(selectedEvaluation) && (
                        <MetricsVisualization
                          type="bar"
                          data={[
                            { metric: 'MSE', value: selectedEvaluation.metrics.mse || 0 },
                            { metric: 'RMSE', value: selectedEvaluation.metrics.rmse || 0 },
                            { metric: 'MAE', value: selectedEvaluation.metrics.mae || 0 },
                            { metric: 'R²', value: selectedEvaluation.metrics.r2 || 0 },
                          ].filter(item => item.value !== 0)}
                          title="Regression Metrics"
                          xKey="metric"
                          yKey="value"
                          height={300}
                        />
                      )}

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Evaluation Parameters</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Test Split:</span>
                            <span>{selectedEvaluation.parameters.test_split}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Random Seed:</span>
                            <span>{selectedEvaluation.parameters.random_seed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Threshold:</span>
                            <span>{selectedEvaluation.parameters.threshold}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confusion Matrix View */}
                  {activeView === 'confusion' && (
                    <div>
                      {selectedEvaluation.confusion_matrix ? (
                        <ConfusionMatrix 
                          matrix={selectedEvaluation.confusion_matrix} 
                          colorScheme="blue"
                        />
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No confusion matrix data available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feature Importance View */}
                  {activeView === 'features' && (
                    <div>
                      {selectedEvaluation.metrics.feature_importance ? (
                        renderFeatureImportance(selectedEvaluation.metrics.feature_importance)
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No feature importance data available.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Select an evaluation to view details.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvaluationPage;