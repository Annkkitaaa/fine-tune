// src/pages/ModelsPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { ModelFormState } from '@/types/model.types';
import { FRAMEWORKS, ARCHITECTURES, ACTIVATION_FUNCTIONS } from '@/constants/model.constants';

export const ModelsPage: React.FC = () => {
  const {
    models,
    loading,
    error,
    hasMore,
    fetchModels,
    createModel,
    deleteModel,
    loadMore
  } = useModels({ pageSize: 50 });

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [modelForm, setModelForm] = useState<ModelFormState>({
    name: '',
    description: '',
    framework: 'pytorch',
    architecture: 'resnet50',
    version: '1.0.0',
    config: {
      hidden_layers: [64, 32],
      activation: 'relu',
      dropout_rate: 0.2
    }
  });

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleCreateModel = async () => {
    try {
      await createModel(modelForm);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    try {
      await deleteModel(modelId);
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const resetForm = () => {
    setModelForm({
      name: '',
      description: '',
      framework: 'pytorch',
      architecture: 'resnet50',
      version: '1.0.0',
      config: {
        hidden_layers: [64, 32],
        activation: 'relu',
        dropout_rate: 0.2
      }
    });
  };

  const filteredModels = models?.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.architecture.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading && !models?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Models</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Model
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Create New Model</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input
                  label="Name"
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={modelForm.description}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                />
                <Select
                  label="Framework"
                  options={FRAMEWORKS}
                  value={modelForm.framework}
                  onChange={(value) => setModelForm({ ...modelForm, framework: value })}
                />
                <Select
                  label="Architecture"
                  options={ARCHITECTURES}
                  value={modelForm.architecture}
                  onChange={(value) => setModelForm({ ...modelForm, architecture: value })}
                />
                <Input
                  label="Version"
                  value={modelForm.version}
                  onChange={(e) => setModelForm({ ...modelForm, version: e.target.value })}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Model Configuration</h3>
                <Input
                  label="Hidden Layers"
                  type="text"
                  value={modelForm.config.hidden_layers.join(', ')}
                  onChange={(e) => setModelForm({
                    ...modelForm,
                    config: {
                      ...modelForm.config,
                      hidden_layers: e.target.value.split(',').map(num => parseInt(num.trim()))
                    }
                  })}
                  placeholder="64, 32"
                />
                <Select
                  label="Activation Function"
                  options={ACTIVATION_FUNCTIONS}
                  value={modelForm.config.activation}
                  onChange={(value) => setModelForm({
                    ...modelForm,
                    config: { ...modelForm.config, activation: value }
                  })}
                />
                <Input
                  label="Dropout Rate"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={modelForm.config.dropout_rate}
                  onChange={(e) => setModelForm({
                    ...modelForm,
                    config: { ...modelForm.config, dropout_rate: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateModel}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Model'
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
                placeholder="Search models..."
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
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Architecture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {model.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.framework}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.architecture}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {model.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(model.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
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

            {!loading && filteredModels.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No models found. {searchQuery ? 'Try a different search term.' : 'Create your first model!'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelsPage;