import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';
import { Search, Upload, Filter, Database } from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [datasetForm, setDatasetForm] = useState({
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
  });

  const formats = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'parquet', label: 'Parquet' },
  ];

  const missingStrategies = [
    { value: 'mean', label: 'Mean' },
    { value: 'median', label: 'Median' },
    { value: 'mode', label: 'Mode' },
  ];

  const outlierMethods = [
    { value: 'zscore', label: 'Z-Score' },
    { value: 'iqr', label: 'IQR' },
  ];

  const mockDatasets = [
    {
      id: '1',
      name: 'ImageNet Subset',
      format: 'JPEG',
      size: '1.2 GB',
      rows: '50,000',
      features: '224x224x3',
      createdAt: '2024-03-15',
    },
    {
      id: '2',
      name: 'Sensor Data',
      format: 'CSV',
      size: '500 MB',
      rows: '1,000,000',
      features: '24',
      createdAt: '2024-03-14',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Datasets</h1>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Dataset
        </Button>
      </div>

      {showUploadForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload New Dataset</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <Input
                  label="Name"
                  value={datasetForm.name}
                  onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={datasetForm.description}
                  onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                />
                <Select
                  label="Format"
                  options={formats}
                  value={datasetForm.format}
                  onChange={(value) => setDatasetForm({ ...datasetForm, format: value })}
                />
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button>Select File</Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    or drag and drop your dataset file here
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Preprocessing Configuration</h3>
                <div className="space-y-4">
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
                </div>

                <div className="space-y-4">
                  <Switch
                    label="Handle Outliers"
                    checked={datasetForm.handleOutliers}
                    onChange={(checked) => setDatasetForm({ ...datasetForm, handleOutliers: checked })}
                  />
                  {datasetForm.handleOutliers && (
                    <>
                      <Select
                        label="Outlier Detection Method"
                        options={outlierMethods}
                        value={datasetForm.outlierMethod}
                        onChange={(value) => setDatasetForm({ ...datasetForm, outlierMethod: value })}
                      />
                      <Slider
                        label="Outlier Threshold"
                        min={1}
                        max={5}
                        step={0.1}
                        value={datasetForm.outlierThreshold}
                        onChange={(value) => setDatasetForm({ ...datasetForm, outlierThreshold: value })}
                      />
                    </>
                  )}
                </div>

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
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowUploadForm(false)}>
                Cancel
              </Button>
              <Button>Upload Dataset</Button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {dataset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.format}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.rows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.features}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dataset.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};