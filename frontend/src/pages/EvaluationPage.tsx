import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LineChart, BarChart2, GitBranch } from 'lucide-react';

export const EvaluationPage: React.FC = () => {
  const [evaluationForm, setEvaluationForm] = useState({
    modelId: '',
    datasetId: '',
    metrics: {
      accuracy: true,
      precision: true,
      recall: true,
      f1Score: true,
      mse: false,
      rmse: false,
      mae: false,
      r2: false,
    },
    testSplit: 0.2,
    randomSeed: 42,
    threshold: 0.5,
  });

  const mockModels = [
    { value: 'model1', label: 'ResNet50 Classifier' },
    { value: 'model2', label: 'Object Detection v2' },
  ];

  const mockDatasets = [
    { value: 'dataset1', label: 'ImageNet Subset' },
    { value: 'dataset2', label: 'Sensor Data' },
  ];

  const mockResults = {
    accuracy: 0.92,
    precision: 0.89,
    recall: 0.94,
    f1Score: 0.91,
    confusionMatrix: [
      [450, 50],
      [30, 470],
    ],
    featureImportance: [
      { feature: 'Feature 1', importance: 0.8 },
      { feature: 'Feature 2', importance: 0.6 },
      { feature: 'Feature 3', importance: 0.4 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Model Evaluation</h1>
      </div>

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
                  options={mockModels}
                  value={evaluationForm.modelId}
                  onChange={(value) => setEvaluationForm({ ...evaluationForm, modelId: value })}
                />
                <Select
                  label="Dataset"
                  options={mockDatasets}
                  value={evaluationForm.datasetId}
                  onChange={(value) => setEvaluationForm({ ...evaluationForm, datasetId: value })}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Switch
                    label="Accuracy"
                    checked={evaluationForm.metrics.accuracy}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, accuracy: checked },
                      })
                    }
                  />
                  <Switch
                    label="Precision"
                    checked={evaluationForm.metrics.precision}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, precision: checked },
                      })
                    }
                  />
                  <Switch
                    label="Recall"
                    checked={evaluationForm.metrics.recall}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, recall: checked },
                      })
                    }
                  />
                  <Switch
                    label="F1 Score"
                    checked={evaluationForm.metrics.f1Score}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, f1Score: checked },
                      })
                    }
                  />
                  <Switch
                    label="MSE"
                    checked={evaluationForm.metrics.mse}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, mse: checked },
                      })
                    }
                  />
                  <Switch
                    label="RMSE"
                    checked={evaluationForm.metrics.rmse}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, rmse: checked },
                      })
                    }
                  />
                  <Switch
                    label="MAE"
                    checked={evaluationForm.metrics.mae}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, mae: checked },
                      })
                    }
                  />
                  <Switch
                    label="R²"
                    checked={evaluationForm.metrics.r2}
                    onChange={(checked) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        metrics: { ...evaluationForm.metrics, r2: checked },
                      })
                    }
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
                  value={evaluationForm.testSplit}
                  onChange={(value) => setEvaluationForm({ ...evaluationForm, testSplit: value })}
                />
                <Input
                  label="Random Seed"
                  type="number"
                  value={evaluationForm.randomSeed}
                  onChange={(e) =>
                    setEvaluationForm({ ...evaluationForm, randomSeed: parseInt(e.target.value) })
                  }
                />
                <Slider
                  label="Threshold"
                  min={0}
                  max={1}
                  step={0.05}
                  value={evaluationForm.threshold}
                  onChange={(value) => setEvaluationForm({ ...evaluationForm, threshold: value })}
                />
              </div>

              <div className="flex justify-end">
                <Button>Evaluate Model</Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <LineChart className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium">Accuracy</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(mockResults.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart2 className="w-5 h-5 text-green-500" />
                    <h3 className="font-medium">F1 Score</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(mockResults.f1Score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Confusion Matrix</h3>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  {mockResults.confusionMatrix.map((row, i) =>
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
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Feature Importance</h3>
                <div className="space-y-2">
                  {mockResults.featureImportance.map((feature) => (
                    <div key={feature.feature} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{feature.feature}</span>
                        <span>{(feature.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${feature.importance * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};