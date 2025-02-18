// src/pages/DeploymentPage.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Loader2, 
  Rocket, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useDeployments } from '@/hooks/useDeployments';
import { useModels } from '@/hooks/useModels';
import { MetricsVisualization } from '@/components/MetricsVisualization';
import { INSTANCE_TYPES } from '@/lib/constants/deployment';
import { Deployment, DeploymentFormState, DeploymentStatus } from '@/lib/types/deployment';

export const DeploymentPage: React.FC = () => {
  const {
    deployments,
    metricsData,
    loading,
    error,
    createDeployment,
    toggleDeploymentStatus,
    restartDeployment,
    deleteDeployment,
    refreshDeployments
  } = useDeployments();

  const { models } = useModels();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [deployForm, setDeployForm] = useState<DeploymentFormState>({
    name: '',
    description: '',
    modelId: '',
    instanceType: 'cpu-small',
    minInstances: 1,
    maxInstances: 3,
    scalingThreshold: 80,
  });

  const handleCreateDeployment = async () => {
    try {
      await createDeployment({
        name: deployForm.name,
        description: deployForm.description,
        model_id: parseInt(deployForm.modelId),
        instance_type: deployForm.instanceType,
        min_instances: deployForm.minInstances,
        max_instances: deployForm.maxInstances,
        scaling_threshold: deployForm.scalingThreshold,
      });
      setShowDeployForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create deployment:', error);
    }
  };

  const handleToggleStatus = async (deploymentId: number, status: DeploymentStatus) => {
    try {
      await toggleDeploymentStatus(deploymentId, status);
    } catch (error) {
      console.error('Failed to toggle deployment status:', error);
    }
  };

  const handleRestartDeployment = async (deploymentId: number) => {
    try {
      await restartDeployment(deploymentId);
    } catch (error) {
      console.error('Failed to restart deployment:', error);
    }
  };

  const handleDeleteDeployment = async (deploymentId: number) => {
    try {
      await deleteDeployment(deploymentId);
    } catch (error) {
      console.error('Failed to delete deployment:', error);
    }
  };

  const resetForm = () => {
    setDeployForm({
      name: '',
      description: '',
      modelId: '',
      instanceType: 'cpu-small',
      minInstances: 1,
      maxInstances: 3,
      scalingThreshold: 80,
    });
  };

  const filteredDeployments = deployments.filter(deployment => 
    deployment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deployment.model_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !deployments.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deployments</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshDeployments}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowDeployForm(!showDeployForm)}>
            <Rocket className="w-4 h-4 mr-2" />
            Deploy Model
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showDeployForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Deploy Model</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input
                  label="Name"
                  value={deployForm.name}
                  onChange={(e) => setDeployForm({ ...deployForm, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={deployForm.description}
                  onChange={(e) => setDeployForm({ ...deployForm, description: e.target.value })}
                />
                <Select
                  label="Model"
                  options={models}
                  value={deployForm.modelId}
                  onChange={(value) => setDeployForm({ ...deployForm, modelId: value })}
                />
                <Select
                  label="Instance Type"
                  options={INSTANCE_TYPES}
                  value={deployForm.instanceType}
                  onChange={(value) => setDeployForm({ ...deployForm, instanceType: value })}
                />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Instances"
                    type="number"
                    min={1}
                    value={deployForm.minInstances}
                    onChange={(e) => setDeployForm({ 
                      ...deployForm, 
                      minInstances: parseInt(e.target.value) 
                    })}
                  />
                  <Input
                    label="Max Instances"
                    type="number"
                    min={1}
                    value={deployForm.maxInstances}
                    onChange={(e) => setDeployForm({ 
                      ...deployForm, 
                      maxInstances: parseInt(e.target.value) 
                    })}
                  />
                </div>
                <Slider
                  label="Scaling Threshold (%)"
                  min={50}
                  max={95}
                  value={deployForm.scalingThreshold}
                  onChange={(value) => setDeployForm({ 
                    ...deployForm, 
                    scalingThreshold: value 
                  })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeployForm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDeployment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsVisualization
          type="line"
          data={metricsData}
          title="Request Rate Over Time"
          xKey="name"
          yKey="requests"
        />
        <MetricsVisualization
          type="line"
          data={metricsData}
          title="Latency Over Time"
          xKey="name"
          yKey="latency"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search deployments..."
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
            {filteredDeployments.map((deployment) => (
              <div
                key={deployment.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{deployment.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deployment.endpoint_url}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        deployment.status === 'running'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {deployment.status}
                    </span>
                    <Button
                      size="sm"
                      variant={deployment.status === 'running' ? 'destructive' : 'default'}
                      onClick={() => handleToggleStatus(deployment.id, deployment.status)}
                      disabled={loading}
                    >
                      {deployment.status === 'running' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRestartDeployment(deployment.id)}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDeployment(deployment.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Instances:</span>{' '}
                    {deployment.instances}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">CPU:</span>{' '}
                    {deployment.metrics?.cpu}%
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Memory:</span>{' '}
                    {deployment.metrics?.memory}%
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Requests:</span>{' '}
                    {deployment.metrics?.requests}/s
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Latency:</span>{' '}
                    {deployment.metrics?.latency}ms
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Uptime:</span>{' '}
                    {formatUptime(deployment.start_time)}
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredDeployments.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No deployments found. {searchQuery ? 'Try a different search term.' : 'Deploy your first model!'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function to format uptime
const formatUptime = (startTime?: string) => {
  if (!startTime) return '-';
  const start = new Date(startTime);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default DeploymentPage;