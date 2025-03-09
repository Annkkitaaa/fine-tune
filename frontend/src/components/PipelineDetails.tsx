// src/components/PipelineDetails.tsx
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { MetricsVisualization } from '@/components/MetricsVisualization';
import { usePipelineUtils } from '@/hooks/usePipelineUtils';
import {
  Clock,
  Database,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { Pipeline } from '@/lib/types/pipeline';

interface PipelineDetailsProps {
  pipeline: Pipeline;
  datasetName?: string;
}

export const PipelineDetails: React.FC<PipelineDetailsProps> = ({
  pipeline,
  datasetName
}) => {
  const utils = usePipelineUtils();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h3 className="text-xl font-medium">
            Pipeline #{pipeline.pipeline_id}
          </h3>
          <p className="text-sm text-gray-500">
            Dataset: {datasetName || `Dataset ${pipeline.dataset_id}`}
          </p>
        </div>
        <div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${utils.getStatusColor(
              pipeline.status
            )}`}
          >
            {pipeline.status}
          </span>
        </div>
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
        <div className="space-y-6 mt-6">
          <h4 className="text-lg font-medium">Analysis Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipeline.results.correlation_matrix && (
              <Card>
                <CardHeader>
                  <h4 className="text-md font-medium">Correlation Analysis</h4>
                </CardHeader>
                <CardContent>
                  <MetricsVisualization
                    type="heatmap"
                    data={utils.transformCorrelationMatrix(pipeline.results.correlation_matrix)}
                    title="Feature Correlations"
                    height={300}
                  />
                </CardContent>
              </Card>
            )}

            {pipeline.results.feature_importance && (
              <Card>
                <CardHeader>
                  <h4 className="text-md font-medium">Feature Importance</h4>
                </CardHeader>
                <CardContent>
                  <MetricsVisualization
                    type="bar"
                    data={utils.transformFeatureImportance(pipeline.results.feature_importance)}
                    title="Feature Importance Scores"
                    xKey="feature"
                    yKey="importance"
                    height={300}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {pipeline.results.data_quality_report && (
            <Card>
              <CardHeader>
                <h4 className="text-md font-medium">Data Quality Report</h4>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Missing Values</p>
                    <p className="text-2xl font-medium">
                      {pipeline.results.data_quality_report.missing_values}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Outliers Detected</p>
                    <p className="text-2xl font-medium">
                      {pipeline.results.data_quality_report.outliers_count}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Duplicate Rows</p>
                    <p className="text-2xl font-medium">
                      {pipeline.results.data_quality_report.duplicate_rows}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Data Completeness</p>
                    <p className="text-2xl font-medium">
                      {pipeline.results.data_quality_report.completeness}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {pipeline.results.preprocessing_summary && (
            <Card>
              <CardHeader>
                <h4 className="text-md font-medium">Preprocessing Summary</h4>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Missing Values Handled:</span>
                      <span className="font-medium">{pipeline.results.preprocessing_summary.missing_values_handled || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Outliers Removed:</span>
                      <span className="font-medium">{pipeline.results.preprocessing_summary.outliers_removed || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Features Scaled:</span>
                      <span className="font-medium">{pipeline.results.preprocessing_summary.features_scaled || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Features Engineered:</span>
                      <span className="font-medium">{pipeline.results.preprocessing_summary.features_engineered || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {pipeline.error_message && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Error</h4>
              <p className="text-sm">{pipeline.error_message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};