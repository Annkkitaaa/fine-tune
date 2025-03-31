// src/pages/DatasetsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert, AlertDescription} from '@/components/ui/Alert';
import { Loader2, Upload, Search, Filter, AlertCircle, Eye, Edit, Download, Save, X, Database, Trash2 } from 'lucide-react';
import { useDatasets } from '@/hooks/useDatasets';
import { SelectOption, DatasetFormState, PreprocessingConfig } from '@/types/dataset.types';
import { MetricsVisualization } from '@/components/MetricsVisualization';

// Extended form state with preprocessing options
const initialFormState: DatasetFormState = {
  name: '',
  description: '',
  format: 'csv',
  handleMissingData: true,
  missingStrategy: 'mean',
  handleOutliers: false,
  outlierMethod: 'zscore',
  outlierThreshold: 3,
  enableScaling: false,
  enableFeatureEngineering: false
};

const formats: SelectOption[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'parquet', label: 'Parquet' },
  { value: 'xlsx', label: 'Excel' },
];

const missingStrategies: SelectOption[] = [
  { value: 'mean', label: 'Replace with Mean' },
  { value: 'median', label: 'Replace with Median' },
  { value: 'zero', label: 'Replace with Zero' },
  { value: 'drop', label: 'Drop Rows' },
];

const outlierMethods: SelectOption[] = [
  { value: 'zscore', label: 'Z-Score' },
  { value: 'iqr', label: 'IQR Method' },
  { value: 'percentile', label: 'Percentile Method' },
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
    loadMore,
    preprocessDataset,
    viewDatasetSample
  } = useDatasets({ pageSize: 50 });

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetForm, setDatasetForm] = useState<DatasetFormState>(initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'view' | 'preprocess'>('upload');
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [datasetSample, setDatasetSample] = useState<any[] | null>(null);
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [preprocessingResult, setPreprocessingResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // Handle file selection
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

  // Upload dataset with preprocessing options
  const handleUploadDataset = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }

    try {
      setUploadError(null);
      setUploadProgress(0);
      
      // Create preprocessing config
      const preprocessingConfig: PreprocessingConfig = {
        handle_missing: datasetForm.handleMissingData,
        missing_strategy: datasetForm.missingStrategy,
        handle_outliers: datasetForm.handleOutliers,
        outlier_method: datasetForm.outlierMethod,
        outlier_threshold: datasetForm.outlierThreshold,
        scaling: datasetForm.enableScaling,
        feature_engineering: datasetForm.enableFeatureEngineering
      };
      
      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Upload the file with preprocessing config
      const result = await uploadDataset(
        selectedFile, 
        datasetForm.name, 
        datasetForm.description, 
        datasetForm.format,
        preprocessingConfig
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form after successful upload
      setTimeout(() => {
        resetForm();
        // Refresh the dataset list
        fetchDatasets();
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload dataset');
      setUploadProgress(0);
    }
  };
  
  // Delete dataset confirmation
  const handleDeleteDataset = async (datasetId: number) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      await deleteDataset(datasetId);
      // If the deleted dataset was selected, clear the selection
      if (selectedDatasetId === datasetId) {
        setSelectedDatasetId(null);
        setDatasetSample(null);
        setDatasetColumns([]);
        setSelectedColumns([]);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setDatasetForm(initialFormState);
    setUploadError(null);
    setUploadProgress(0);
  };

  // View dataset sample
  const handleViewDataset = async (datasetId: number) => {
    try {
      setIsProcessing(true);
      setActiveTab('view');
      setSelectedDatasetId(datasetId);
      
      const result = await viewDatasetSample(datasetId);
      
      if (result) {
        setDatasetSample(result.data);
        setDatasetColumns(result.columns);
        setSelectedColumns(result.columns);
      }
    } catch (error) {
      console.error('Error viewing dataset:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle column selection for filtering
  const handleColumnSelect = (column: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Apply preprocessing to dataset
  const handlePreprocessDataset = async () => {
    if (!selectedDatasetId) return;
    
    try {
      setIsProcessing(true);
      
      // Create preprocessing config from form
      const preprocessingConfig: PreprocessingConfig = {
        handle_missing: datasetForm.handleMissingData,
        missing_strategy: datasetForm.missingStrategy,
        handle_outliers: datasetForm.handleOutliers,
        outlier_method: datasetForm.outlierMethod,
        outlier_threshold: datasetForm.outlierThreshold,
        scaling: datasetForm.enableScaling,
        feature_engineering: datasetForm.enableFeatureEngineering
      };
      
      const result = await preprocessDataset(
        selectedDatasetId,
        preprocessingConfig,
        selectedColumns,
        filterCondition
      );
      
      if (result) {
        setPreprocessingResult(result);
        // Show the processed sample
        setDatasetSample(result.sample_data);
      }
    } catch (error) {
      console.error('Error preprocessing dataset:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save preprocessed dataset
  const handleSaveProcessedDataset = async () => {
    if (!preprocessingResult || !selectedDatasetId) return;
    
    try {
      setIsProcessing(true);
      
      // This would call an API to save the processed dataset
      // Implementation depends on backend capabilities
      await fetch(`/api/v1/data/${selectedDatasetId}/save-processed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processed_id: preprocessingResult.processed_id,
          name: `${datasetForm.name}_processed`,
        }),
      });
      
      // Refresh the dataset list
      fetchDatasets();
      
      // Reset preprocessing state
      setPreprocessingResult(null);
      
    } catch (error) {
      console.error('Error saving processed dataset:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter datasets based on search query
  const filteredDatasets = datasets?.filter(dataset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      (dataset.name?.toLowerCase() || '').includes(query) ||
      (dataset.format?.toLowerCase() || '').includes(query)
    );
  }) || [];

  // Loading state
  if (loading && !datasets?.length) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Get the selected dataset
  const selectedDataset = selectedDatasetId 
    ? datasets?.find(d => d.id === selectedDatasetId)
    : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Datasets</h1>
        <div className="flex space-x-2">
          <Button onClick={() => {
            setActiveTab('upload');
            setShowUploadForm(!showUploadForm);
          }}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Dataset
          </Button>
          {selectedDatasetId && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => handleViewDataset(selectedDatasetId)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setActiveTab('preprocess')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Preprocess
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab navigation for the three main sections */}
      {selectedDatasetId && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            Dataset List
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'view'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleViewDataset(selectedDatasetId)}
          >
            View Dataset
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'preprocess'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('preprocess')}
          >
            Preprocess
          </button>
        </div>
      )}

      {/* Upload form card */}
      {showUploadForm && activeTab === 'upload' && (
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
                accept=".csv,.json,.parquet,.xlsx,.xls"
                required
                label="Upload File"
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Preprocessing Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="handleMissingData"
                    checked={datasetForm.handleMissingData}
                    onChange={(e) => setDatasetForm({ ...datasetForm, handleMissingData: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="handleMissingData" className="text-sm font-medium">
                    Handle Missing Values
                  </label>
                </div>
                
                {datasetForm.handleMissingData && (
                  <Select
                    label="Missing Value Strategy"
                    options={missingStrategies}
                    value={datasetForm.missingStrategy}
                    onChange={(value) => setDatasetForm({ ...datasetForm, missingStrategy: value })}
                  />
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="handleOutliers"
                    checked={datasetForm.handleOutliers}
                    onChange={(e) => setDatasetForm({ ...datasetForm, handleOutliers: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="handleOutliers" className="text-sm font-medium">
                    Handle Outliers
                  </label>
                </div>
                
                {datasetForm.handleOutliers && (
                  <>
                    <Select
                      label="Outlier Detection Method"
                      options={outlierMethods}
                      value={datasetForm.outlierMethod}
                      onChange={(value) => setDatasetForm({ ...datasetForm, outlierMethod: value })}
                    />
                    <Input
                      type="number"
                      label="Outlier Threshold"
                      value={datasetForm.outlierThreshold}
                      onChange={(e) => setDatasetForm({ 
                        ...datasetForm, 
                        outlierThreshold: parseFloat(e.target.value) 
                      })}
                      min={1}
                      max={10}
                      step={0.1}
                    />
                  </>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableScaling"
                    checked={datasetForm.enableScaling}
                    onChange={(e) => setDatasetForm({ ...datasetForm, enableScaling: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="enableScaling" className="text-sm font-medium">
                    Enable Feature Scaling
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableFeatureEngineering"
                    checked={datasetForm.enableFeatureEngineering}
                    onChange={(e) => setDatasetForm({ ...datasetForm, enableFeatureEngineering: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="enableFeatureEngineering" className="text-sm font-medium">
                    Enable Feature Engineering
                  </label>
                </div>
              </div>
            </div>
            
            {uploadProgress > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Upload progress: {uploadProgress}%</p>
              </div>
            )}
            
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

      {/* View Dataset Tab */}
      {activeTab === 'view' && selectedDatasetId && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedDataset?.name || 'Dataset View'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Format: {selectedDataset?.format?.toUpperCase() || 'Unknown'} • 
                Size: {formatFileSize(selectedDataset?.size)} • 
                Rows: {selectedDataset?.num_rows?.toLocaleString() || 'Unknown'} • 
                Features: {selectedDataset?.num_features || 'Unknown'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
                <span>Loading dataset...</span>
              </div>
            ) : (
              <>
                {/* Filtering options */}
                <div className="mb-6 border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-lg font-medium mb-3">Filter Options</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Select Columns</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-white dark:bg-gray-900">
                        {datasetColumns.map(column => (
                          <div 
                            key={column}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                              selectedColumns.includes(column)
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                            onClick={() => handleColumnSelect(column)}
                          >
                            {column}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Input
                        label="Filter Condition (SQL-like)"
                        placeholder="e.g. age > 30 AND income < 5000"
                        value={filterCondition}
                        onChange={(e) => setFilterCondition(e.target.value)}
                      />
                      <Button 
                        className="mt-2 w-full"
                        onClick={() => handleViewDataset(selectedDatasetId)}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dataset table */}
                {datasetSample ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {Object.keys(datasetSample[0] || {})
                            .filter(col => selectedColumns.includes(col))
                            .map(column => (
                              <th 
                                key={column}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {datasetSample.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.keys(row)
                              .filter(col => selectedColumns.includes(col))
                              .map(column => (
                                <td 
                                  key={`${rowIndex}-${column}`}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                                >
                                  {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column])}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No data to display. Select a dataset to view.</p>
                  </div>
                )}
                
                {/* Data statistics visualization */}
                {datasetSample && selectedDataset?.meta_info?.statistics && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">Dataset Statistics</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sample visualization */}
                      <div className="border rounded-md p-4">
                        <h4 className="text-md font-medium mb-2">Numeric Distribution</h4>
                        <MetricsVisualization
                          type="line"
                          data={[
                            { name: 'Min', value: 0 },
                            { name: 'Q1', value: 25 },
                            { name: 'Median', value: 50 },
                            { name: 'Q3', value: 75 },
                            { name: 'Max', value: 100 },
                          ]}
                          title="Value Distribution"
                          xKey="name"
                          yKey="value"
                          height={200}
                        />
                      </div>
                      
                      {/* Missing values visualization */}
                      <div className="border rounded-md p-4">
                        <h4 className="text-md font-medium mb-2">Missing Values</h4>
                        <MetricsVisualization
                          type="line"
                          data={[
                            { name: 'Complete', value: 95 },
                            { name: 'Missing', value: 5 },
                          ]}
                          title="Data Completeness"
                          xKey="name"
                          yKey="value"
                          height={200}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preprocessing Tab */}
      {activeTab === 'preprocess' && selectedDatasetId && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Preprocess Dataset: {selectedDataset?.name}</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-3">Data Cleaning</h3>
              </div>

              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="handleMissingData"
                  checked={datasetForm.handleMissingData}
                  onChange={(e) => setDatasetForm({ ...datasetForm, handleMissingData: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="handleMissingData" className="text-sm font-medium">
                  Handle Missing Values
                </label>
              </div>
              
              {datasetForm.handleMissingData && (
                <Select
                  label="Missing Value Strategy"
                  options={missingStrategies}
                  value={datasetForm.missingStrategy}
                  onChange={(value) => setDatasetForm({ ...datasetForm, missingStrategy: value })}
                />
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="handleOutliers"
                  checked={datasetForm.handleOutliers}
                  onChange={(e) => setDatasetForm({ ...datasetForm, handleOutliers: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="handleOutliers" className="text-sm font-medium">
                  Handle Outliers
                </label>
              </div>
              
              {datasetForm.handleOutliers && (
                <>
                  <Select
                    label="Outlier Detection Method"
                    options={outlierMethods}
                    value={datasetForm.outlierMethod}
                    onChange={(value) => setDatasetForm({ ...datasetForm, outlierMethod: value })}
                  />
                  <Input
                    type="number"
                    label="Outlier Threshold"
                    value={datasetForm.outlierThreshold}
                    onChange={(e) => setDatasetForm({ 
                      ...datasetForm, 
                      outlierThreshold: parseFloat(e.target.value) 
                    })}
                    min={1}
                    max={10}
                    step={0.1}
                  />
                </>
              )}
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-3">Feature Processing</h3>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableScaling"
                  checked={datasetForm.enableScaling}
                  onChange={(e) => setDatasetForm({ ...datasetForm, enableScaling: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="enableScaling" className="text-sm font-medium">
                  Enable Feature Scaling
                </label>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setActiveTab('view')}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePreprocessDataset}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Preprocess Dataset
                  </>
                )}
              </Button>
            </div>
            </div>
          </CardContent>
          
          {/* Preprocessing Results Section */}
          {preprocessingResult && (
            <CardFooter className="flex flex-col">
              <div className="w-full">
                <h3 className="text-lg font-medium mb-3">Preprocessing Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-md p-4">
                    <h4 className="text-md font-medium mb-2">Before Preprocessing</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Rows: {preprocessingResult.original_rows}</li>
                      <li>Columns: {preprocessingResult.original_columns}</li>
                      <li>Missing Values: {preprocessingResult.original_missing}</li>
                      <li>Outliers: {preprocessingResult.original_outliers}</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="text-md font-medium mb-2">After Preprocessing</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Rows: {preprocessingResult.processed_rows}</li>
                      <li>Columns: {preprocessingResult.processed_columns}</li>
                      <li>Missing Values: {preprocessingResult.processed_missing}</li>
                      <li>Outliers: {preprocessingResult.processed_outliers}</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 mb-4">
                  <h4 className="text-md font-medium mb-2">Sample of Processed Data</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {preprocessingResult.sample_data && 
                           preprocessingResult.sample_data.length > 0 && 
                           Object.keys(preprocessingResult.sample_data[0] || {})
                            .map(column => (
                              <th 
                                key={column}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {preprocessingResult.sample_data &&
                         preprocessingResult.sample_data.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.keys(row).map(column => (
                              <td 
                                key={`${rowIndex}-${column}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                              >
                                {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setPreprocessingResult(null)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Preview
                  </Button>
                  <Button 
                    onClick={handleSaveProcessedDataset}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Processed Dataset
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
      

      {/* Dataset List Card */}
      {activeTab === 'upload' && (
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
                    <tr 
                      key={dataset.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedDatasetId === dataset.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                      onClick={() => setSelectedDatasetId(dataset.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {dataset.name || 'Unnamed Dataset'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {dataset.format ? dataset.format.toUpperCase() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatFileSize(dataset.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {dataset.num_rows?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {dataset.num_features || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {dataset.created_at 
                          ? new Date(dataset.created_at).toLocaleDateString() 
                          : 'Invalid Date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDataset(dataset.id);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDataset(dataset.id);
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredDatasets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No datasets found
                      </td>
                    </tr>
                  )}
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
      )}
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