// src/pages/EvaluationPage.tsx
import React, { useEffect } from 'react';
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
  GitBranch,
  RefreshCw
} from 'lucide-react';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useModels } from '@/hooks/useModels';
import { useDatasets } from '@/hooks/useDatasets';
import { MetricsVisualization } from '@/components/MetricsVisualization';

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

  const { models, loading: modelsLoading } = useModels();
  const { datasets, loading: datasetsLoading } = useDatasets();

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const handleStartEvaluation = async () => {
    try {
      await startEvaluation();
      resetEvaluationForm();
    } catch (error) {
      console.error('Failed to start evaluation:', error);
    }
  };

  const renderConfusionMatrix = (matrix: number[][]) => {
    return (
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {matrix.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center"
            >
              <p className="text-lg font-bold">{cell}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {i === 0 ? (j === 0 ? 'True Neg' : 'False Pos') : j === 0 ? 'False Neg' : 'True Pos'}
              </p>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderFeatureImportance = (importance: Record<string, number>) => {
    const data = Object.entries(importance)
      .map(([feature, value]) => ({
        feature,
        importance: value
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);

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

  if (loading && !evaluations.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Evaluation Configuration</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <Select
                  label="Model"
                  options={models}
                  value={evaluationForm.modelId}
                  onChange={(value) => updateEvaluationForm({ modelId: value })}
                  isLoading={modelsLoading}
                />
                <Select
                  label="Dataset"
                  options={datasets}
                  value={evaluationForm.datasetId}
                  onChange={(value) => updateEvaluationForm({ datasetId: value })}
                  isLoading={datasetsLoading}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(evaluationForm.metrics).map(([key, value]) => (
                    <Switch
                      key={key}
                      label={key.toUpperCase()}
                      checked={value}
                      onChange={(checked) => updateEvaluationForm({
                        metrics: { ...evaluationForm.metrics, [key]: checked }
                      })}
                    />
                  ))}
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
                  value={evaluationForm.parameters.random_seed}
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

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={resetEvaluationForm}
                  disabled={loading}
                >
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

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Evaluation Results</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {evaluations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    No evaluations found. Start by evaluating a model!
                  </p>
                </div>
              ) : (
                evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <LineChart className="w-5 h-5 text-blue-500" />
                          <h3 className="font-medium">Accuracy</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(evaluation.metrics.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart2 className="w-5 h-5 text-green-500" />
                          <h3 className="font-medium">F1 Score</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(evaluation.metrics.f1_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {evaluation.metrics.confusion_matrix && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Confusion Matrix</h3>
                        {renderConfusionMatrix(evaluation.metrics.confusion_matrix)}
                      </div>
                    )}

                    {evaluation.metrics.feature_importance && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Feature Importance</h3>
                        {renderFeatureImportance(evaluation.metrics.feature_importance)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Model:</span>
                          <span>{models.find(m => m.value === evaluation.model_id.toString())?.label}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Dataset:</span>
                          <span>{datasets.find(d => d.value === evaluation.dataset_id.toString())?.label}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Execution Time:</span>
                          <span>{evaluation.execution_time}s</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Precision:</span>
                          <span>{(evaluation.metrics.precision * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Recall:</span>
                          <span>{(evaluation.metrics.recall * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span>{new Date(evaluation.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {evaluation.metrics.mse && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">MSE:</span>{' '}
                          {evaluation.metrics.mse.toFixed(4)}
                        </div>
                        {evaluation.metrics.rmse && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">RMSE:</span>{' '}
                            {evaluation.metrics.rmse.toFixed(4)}
                          </div>
                        )}
                        {evaluation.metrics.mae && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">MAE:</span>{' '}
                            {evaluation.metrics.mae.toFixed(4)}
                          </div>
                        )}
                        {evaluation.metrics.r2 && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">R²:</span>{' '}
                            {evaluation.metrics.r2.toFixed(4)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvaluationPage;