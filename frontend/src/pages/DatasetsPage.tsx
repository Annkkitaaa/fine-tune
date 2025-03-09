// src/pages/DatasetsPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Alert, AlertDescription} from '@/components/ui/Alert';
import { Loader2, Upload, Search, Filter, AlertCircle } from 'lucide-react';
import { useDatasets } from '@/hooks/useDatasets';
import { DatasetFormState, SelectOption } from '@/types/dataset.types';

const initialFormState: DatasetFormState = {
  name: '',
  description: '',
  format: 'csv',
  handleMissingData: true,
  missingStrategy: 'mean',
  handleOutliers: true,
  outlierMethod: 'zscore',
  outlierThreshold: 3,
  enableScaling: true,
  enableFeatureEngineering: false,
};

const formats: SelectOption[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'parquet', label: 'Parquet' },
];

const missingStrategies: SelectOption[] = [
  { value: 'mean', label: 'Mean' },
  { value: 'median', label: 'Median' },
  { value: 'mode', label: 'Mode' },
];

const outlierMethods: SelectOption[] = [
  { value: 'zscore', label: 'Z-Score' },
  { value: 'iqr', label: 'IQR' },
];

export const DatasetsPage: React.FC = () => {
  const {
    datasets,
    loading,
    error,
    hasMore,
    fetchDatasets,
    uploadDataset,
    deleteDataset,
    loadMore
  } = useDatasets({ pageSize: 50 });

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetForm, setDatasetForm] = useState<DatasetFormState>(initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename without extension
      setDatasetForm(prev => ({
        ...prev,
        name: file.name.split('.')[0]
      }));
      setUploadError(null);
    }
  };

  
  const handleUploadDataset = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }
  
    try {
      setUploadError(null);
      
      // Prepare preprocessing config
      const preprocessing_config = {
        handle_missing: datasetForm.handleMissingData,
        missing_strategy: datasetForm.missingStrategy,
        handle_outliers: datasetForm.handleOutliers,
        outlier_method: datasetForm.outlierMethod,
        outlier_threshold: datasetForm.outlierThreshold,
        scaling: datasetForm.enableScaling,
        feature_engineering: datasetForm.enableFeatureEngineering,
      };
      
      // Upload the file with metadata
      await uploadDataset(selectedFile, {
        name: datasetForm.name,
        description: datasetForm.description,
        format: datasetForm.format,
        preprocessing_config
      });
      
      // Reset form after successful upload
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload dataset');
    }
  };
  
  const handleDeleteDataset = async (datasetId: number) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      await deleteDataset(datasetId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setDatasetForm(initialFormState);
    setUploadError(null);
  };

  const filteredDatasets = datasets?.filter(dataset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      dataset.name.toLowerCase().includes(query) ||
      dataset.format.toLowerCase().includes(query)
    );
  }) || [];

  if (loading && !datasets?.length) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Datasets</h1>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Dataset
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showUploadForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload New Dataset</h2>
          </CardHeader>
          <CardContent>
            {uploadError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                value={datasetForm.name}
                onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })}
                placeholder="Dataset name"
                required
              />
              <Input
                label="Description"
                value={datasetForm.description}
                onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                placeholder="Optional description"
              />
              <Select
                label="Format"
                options={formats}
                value={datasetForm.format}
                onChange={(value) => setDatasetForm({ ...datasetForm, format: value })}
              />
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".csv,.json,.parquet"
                required
              />
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-4">Preprocessing Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    label="Handle Missing Data"
                    checked={datasetForm.handleMissingData}
                    onChange={(checked) => setDatasetForm({ ...datasetForm, handleMissingData: checked })}
                  />
                  {datasetForm.handleMissingData && (
                    <Select
                      label="Missing Data Strategy"
                      options={missingStrategies}
                      value={datasetForm.missingStrategy}
                      onChange={(value) => setDatasetForm({ ...datasetForm, missingStrategy: value })}
                    />
                  )}
                  <Switch
                    label="Handle Outliers"
                    checked={datasetForm.handleOutliers}
                    onChange={(checked) => setDatasetForm({ ...datasetForm, handleOutliers: checked })}
                  />
                  {datasetForm.handleOutliers && (
                    <>
                      <Select
                        label="Outlier Method"
                        options={outlierMethods}
                        value={datasetForm.outlierMethod}
                        onChange={(value) => setDatasetForm({ ...datasetForm, outlierMethod: value })}
                      />
                      <div className="col-span-2">
                        <Slider
                          label="Outlier Threshold"
                          min={1}
                          max={5}
                          step={0.1}
                          value={datasetForm.outlierThreshold}
                          onChange={(value) => setDatasetForm({ ...datasetForm, outlierThreshold: value })}
                        />
                      </div>
                    </>
                  )}
                  <Switch
                    label="Enable Scaling"
                    checked={datasetForm.enableScaling}
                    onChange={(checked) => setDatasetForm({ ...datasetForm, enableScaling: checked })}
                  />
                  <Switch
                    label="Enable Feature Engineering"
                    checked={datasetForm.enableFeatureEngineering}
                    onChange={(checked) => setDatasetForm({ ...datasetForm, enableFeatureEngineering: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadDataset}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Dataset'
                )}
              </Button>
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
                placeholder="Search datasets..."
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {dataset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.format.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatFileSize(dataset.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.num_rows?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.num_features}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleDeleteDataset(dataset.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="secondary" 
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default DatasetsPage;