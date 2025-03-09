import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Loader2,
  GitBranch,
  Play,
  Clock,
  AlertCircle,
  Database,
  BarChart2,
  RefreshCcw,
  Download
} from 'lucide-react';
import { MetricsVisualization } from '@/components/MetricsVisualization';
import { usePipeline } from '@/hooks/usePipeline';
import { usePipelineUtils } from '@/hooks/usePipelineUtils';
import { useDatasets } from '@/hooks/useDatasets';
import { 
  AUGMENTATION_METHODS, 
  MISSING_STRATEGIES, 
  OUTLIER_METHODS 
} from '@/lib/constants/pipeline';

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="p-6">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Error loading pipeline page: {error instanceof Error ? error.message : 'Unknown error'}
      </AlertDescription>
    </Alert>
    <Button 
      className="mt-4"
      onClick={resetErrorBoundary}
    >
      Reload Page
    </Button>
  </div>
);

export const PipelinePage = () => {
  // IMPORTANT: All hooks must be called at the top level, outside of any conditions
  const [pageError, setPageError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [datasetOptions, setDatasetOptions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Use refs to track if initialization has been done
  const initialized = useRef(false);
  const datasetOptionsSet = useRef(false);

  // Call hooks unconditionally
  const {
    pipelines,
    pipelineForm,
    loading,
    isSubmitting,
    error,
    createPipeline,
    rerunPipeline,
    updatePipelineForm,
    resetPipelineForm,
    refreshPipelines
  } = usePipeline();

  const { 
    datasets: datasetObjects, 
    loading: datasetsLoading, 
    error: datasetsError, 
    fetchDatasets 
  } = useDatasets();
  
  const utils = usePipelineUtils();

  // Transform raw datasets into options format when datasets change - only once
  useEffect(() => {
    if (datasetObjects && datasetObjects.length > 0 && !datasetOptionsSet.current) {
      console.log("Setting dataset options");
      const options = datasetObjects.map(dataset => ({
        value: dataset.id?.toString() || "",
        label: dataset.name || `Dataset ${dataset.id || "Unknown"}`
      }));
      
      setDatasetOptions(options);
      datasetOptionsSet.current = true;
    }
  }, [datasetObjects]);

  // Initialize page - safely fetch data once
  useEffect(() => {
    // Only run this effect once
    if (!initialized.current) {
      console.log("PipelinePage initializing");
      
      const initData = async () => {
        try {
          setPageLoading(true);
          setPageError(null);
          
          await fetchDatasets()
            .catch(err => {
              console.error("Error fetching datasets:", err);
            });
          
          await refreshPipelines()
            .catch(err => {
              console.error("Error fetching pipelines:", err);
            });
        } catch (error) {
          console.error("Error during page initialization:", error);
          setPageError("Failed to load some data. You may need to refresh the page.");
        } finally {
          setPageLoading(false);
          initialized.current = true;
        }
      };
      
      initData();
    }
  }, []); // Empty dependency array means this only runs once

  const handleCreatePipeline = useCallback(async () => {
    try {
      console.log("Creating pipeline with form:", pipelineForm);
      if (!pipelineForm.datasetId) {
        console.error("No dataset selected");
        setPageError("Please select a dataset");
        return;
      }
      
      const result = await createPipeline();
      console.log("Pipeline created:", result);
      setShowCreateForm(false);
      resetPipelineForm();
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      setPageError(error instanceof Error ? error.message : 'Failed to create pipeline');
    }
  }, [pipelineForm, createPipeline, resetPipelineForm]);

  const handleRerunPipeline = useCallback(async (pipelineId) => {
    try {
      console.log("Rerunning pipeline:", pipelineId);
      await rerunPipeline(pipelineId);
    } catch (error) {
      console.error('Failed to rerun pipeline:', error);
      setPageError(error instanceof Error ? error.message : 'Failed to rerun pipeline');
    }
  }, [rerunPipeline]);

  // Handle loading state
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Loading pipeline dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (pageError) {
    return (
      <ErrorFallback 
        error={pageError} 
        resetErrorBoundary={() => window.location.reload()}
      />
    );
  }

  // Main component render
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ML Pipelines</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshPipelines}
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <GitBranch className="w-4 h-4 mr-2" />
            Create Pipeline
          </Button>
        </div>
      </div>

      {(error || pageError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || pageError}</AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Pipeline Configuration</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Select
                label="Dataset"
                options={datasetOptions}
                value={pipelineForm.datasetId}
                onChange={(value) => {
                  console.log("Dataset selected:", value);
                  updatePipelineForm({ datasetId: value });
                }}
                isLoading={datasetsLoading}
                error={datasetsError || undefined}
              />

              {/* Debug info */}
              <div className="text-xs text-gray-500 p-2 border-t mt-2">
                <p>Form state: Dataset ID: {pipelineForm.datasetId || 'none'}</p>
                <p>Datasets loaded: {datasetObjects?.length || 0}</p>
                <p>Dataset options: {datasetOptions?.length || 0}</p>
              </div>

              {/* Preprocessing Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preprocessing Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Switch
                      label="Handle Missing Data"
                      checked={pipelineForm.config.preprocessing.handleMissingData}
                      onChange={(checked) => updatePipelineForm({
                        config: {
                          ...pipelineForm.config,
                          preprocessing: {
                            ...pipelineForm.config.preprocessing,
                            handleMissingData: checked
                          }
                        }
                      })}
                    />
                    {pipelineForm.config.preprocessing.handleMissingData && (
                      <Select
                        label="Missing Data Strategy"
                        options={MISSING_STRATEGIES}
                        value={pipelineForm.config.preprocessing.missingStrategy}
                        onChange={(value) => updatePipelineForm({
                          config: {
                            ...pipelineForm.config,
                            preprocessing: {
                              ...pipelineForm.config.preprocessing,
                              missingStrategy: value
                            }
                          }
                        })}
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <Switch
                      label="Handle Outliers"
                      checked={pipelineForm.config.preprocessing.handleOutliers}
                      onChange={(checked) => updatePipelineForm({
                        config: {
                          ...pipelineForm.config,
                          preprocessing: {
                            ...pipelineForm.config.preprocessing,
                            handleOutliers: checked
                          }
                        }
                      })}
                    />
                    {pipelineForm.config.preprocessing.handleOutliers && (
                      <>
                        <Select
                          label="Outlier Method"
                          options={OUTLIER_METHODS}
                          value={pipelineForm.config.preprocessing.outlierMethod}
                          onChange={(value) => updatePipelineForm({
                            config: {
                              ...pipelineForm.config,
                              preprocessing: {
                                ...pipelineForm.config.preprocessing,
                                outlierMethod: value
                              }
                            }
                          })}
                        />
                        <Slider
                          label="Outlier Threshold"
                          min={1}
                          max={5}
                          step={0.1}
                          value={pipelineForm.config.preprocessing.outlierThreshold}
                          onChange={(value) => updatePipelineForm({
                            config: {
                              ...pipelineForm.config,
                              preprocessing: {
                                ...pipelineForm.config.preprocessing,
                                outlierThreshold: value
                              }
                            }
                          })}
                        />
                      </>
                    )}
                  </div>
                </div>

                <Switch
                  label="Enable Scaling"
                  checked={pipelineForm.config.preprocessing.scaling}
                  onChange={(checked) => updatePipelineForm({
                    config: {
                      ...pipelineForm.config,
                      preprocessing: {
                        ...pipelineForm.config.preprocessing,
                        scaling: checked
                      }
                    }
                  })}
                />

                <Switch
                  label="Enable Feature Engineering"
                  checked={pipelineForm.config.preprocessing.featureEngineering}
                  onChange={(checked) => updatePipelineForm({
                    config: {
                      ...pipelineForm.config,
                      preprocessing: {
                        ...pipelineForm.config.preprocessing,
                        featureEngineering: checked
                      }
                    }
                  })}
                />
              </div>

              {/* Analysis Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Analysis Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    label="Correlation Analysis"
                    checked={pipelineForm.config.analysis.performCorrelation}
                    onChange={(checked) => updatePipelineForm({
                      config: {
                        ...pipelineForm.config,
                        analysis: {
                          ...pipelineForm.config.analysis,
                          performCorrelation: checked
                        }
                      }
                    })}
                  />
                  <Switch
                    label="Feature Importance"
                    checked={pipelineForm.config.analysis.enableFeatureImportance}
                    onChange={(checked) => updatePipelineForm({
                      config: {
                        ...pipelineForm.config,
                        analysis: {
                          ...pipelineForm.config.analysis,
                          enableFeatureImportance: checked
                        }
                      }
                    })}
                  />
                  <Switch
                    label="Generate Visualizations"
                    checked={pipelineForm.config.analysis.generateVisualizations}
                    onChange={(checked) => updatePipelineForm({
                      config: {
                        ...pipelineForm.config,
                        analysis: {
                          ...pipelineForm.config.analysis,
                          generateVisualizations: checked
                        }
                      }
                    })}
                  />
                </div>
              </div>

              {/* Augmentation Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Augmentation Settings</h3>
                <Select
                  label="Method"
                  options={AUGMENTATION_METHODS}
                  value={pipelineForm.config.augmentation.method}
                  onChange={(value) => updatePipelineForm({
                    config: {
                      ...pipelineForm.config,
                      augmentation: {
                        ...pipelineForm.config.augmentation,
                        method: value
                      }
                    }
                  })}
                />
                {pipelineForm.config.augmentation.method !== 'none' && (
                  <Slider
                    label="Augmentation Factor"
                    min={0}
                    max={1}
                    step={0.1}
                    value={pipelineForm.config.augmentation.factor}
                    onChange={(value) => updatePipelineForm({
                      config: {
                        ...pipelineForm.config,
                        augmentation: {
                          ...pipelineForm.config.augmentation,
                          factor: value
                        }
                      }
                    })}
                  />
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowCreateForm(false);
                    resetPipelineForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePipeline}
                  disabled={!pipelineForm.datasetId} 
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Run Pipeline'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Status */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Pipeline Status</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {!pipelines || pipelines.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No pipelines found. Create your first pipeline!
                </p>
              </div>
            ) : (
              pipelines.map((pipeline) => (
                <div
                  key={pipeline.pipeline_id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        Pipeline #{pipeline.pipeline_id}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dataset: {datasetOptions.find ? 
                          datasetOptions.find(d => d.value === pipeline.dataset_id.toString())?.label || 
                          `Dataset ${pipeline.dataset_id}` : 
                          `Dataset ${pipeline.dataset_id}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${utils.getStatusColor(
                          pipeline.status
                        )}`}
                      >
                        {pipeline.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{pipeline.status === 'completed' ? '100%' : '...'}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: pipeline.status === 'completed' ? '100%' : 
                                pipeline.status === 'running' ? '75%' : '0%'
                        }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{new Date(pipeline.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span>{utils.formatProcessedData(pipeline.results?.processed_rows)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <BarChart2 className="w-4 h-4 text-gray-400" />
                        <span>{utils.formatDuration(pipeline.execution_time)}</span>
                      </div>
                    </div>

                    {pipeline.results && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pipeline.results.correlation_matrix && (
                            <Card>
                              <CardHeader>
                                <h4 className="text-sm font-medium">Correlation Analysis</h4>
                              </CardHeader>
                              <CardContent>
                              <MetricsVisualization
                                  type="heatmap"
                                  data={utils.transformCorrelationMatrix(pipeline.results.correlation_matrix)}
                                  title="Feature Correlations"
                                  height={250}
                                />
                              </CardContent>
                            </Card>
                          )}

                          {pipeline.results.feature_importance && (
                            <Card>
                              <CardHeader>
                                <h4 className="text-sm font-medium">Feature Importance</h4>
                              </CardHeader>
                              <CardContent>
                                <MetricsVisualization
                                  type="bar"
                                  data={utils.transformFeatureImportance(pipeline.results.feature_importance)}
                                  title="Feature Importance Scores"
                                  xKey="feature"
                                  yKey="importance"
                                  height={250}
                                />
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {pipeline.results.data_quality_report && (
                          <Card>
                            <CardHeader>
                              <h4 className="text-sm font-medium">Data Quality Report</h4>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Missing Values</p>
                                  <p className="text-lg font-medium">
                                    {pipeline.results.data_quality_report.missing_values}%
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Outliers Detected</p>
                                  <p className="text-lg font-medium">
                                    {pipeline.results.data_quality_report.outliers_count}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Duplicate Rows</p>
                                  <p className="text-lg font-medium">
                                    {pipeline.results.data_quality_report.duplicate_rows}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500">Data Completeness</p>
                                  <p className="text-lg font-medium">
                                    {pipeline.results.data_quality_report.completeness}%
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {pipeline.error_message && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{pipeline.error_message}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end space-x-2">
                      {pipeline.status === 'completed' && pipeline.results?.download_url && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.location.href = pipeline.results!.download_url!}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Results
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRerunPipeline(pipeline.pipeline_id)}
                        disabled={loading}
                      >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Rerun Pipeline
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelinePage;