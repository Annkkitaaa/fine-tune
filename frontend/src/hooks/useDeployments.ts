// src/hooks/useDeployments.ts
import { useState, useCallback, useEffect } from 'react';
import {
  Deployment,
  DeploymentCreateRequest,
  DeploymentStatus,
  MetricsData
} from '@/types/deployment.types';
import { deploymentService } from '@/services/deployment.service';

export function useDeployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformMetrics = (deployment: Deployment): MetricsData => {
    const metrics = deployment.metrics || {};
    return {
      name: deployment.name,
      requests: typeof metrics.requests === 'number' ? metrics.requests : 0,
      latency: typeof metrics.latency === 'number' ? metrics.latency : 0,
      cpu: typeof metrics.cpu === 'number' ? metrics.cpu : 0,
      memory: typeof metrics.memory === 'number' ? metrics.memory : 0
    };
  };

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deploymentService.getDeployments();
      setDeployments(response);
      
      // Transform metrics for visualization with safe type checking
      const metrics = response.map(transformMetrics);
      setMetricsData(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeployment = useCallback(async (data: DeploymentCreateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deploymentService.createDeployment(data);
      setDeployments(prev => [response, ...prev]);
      setMetricsData(prev => [transformMetrics(response), ...prev]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deployment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDeploymentStatus = useCallback(async (deploymentId: number, currentStatus: DeploymentStatus) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deploymentService.toggleStatus(deploymentId, currentStatus);
      setDeployments(prev => prev.map(dep => 
        dep.id === deploymentId ? response : dep
      ));
      setMetricsData(prev => prev.map(metric => 
        metric.name === response.name ? transformMetrics(response) : metric
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle deployment status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restartDeployment = useCallback(async (deploymentId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deploymentService.restartDeployment(deploymentId);
      setDeployments(prev => prev.map(dep => 
        dep.id === deploymentId ? response : dep
      ));
      setMetricsData(prev => prev.map(metric => 
        metric.name === response.name ? transformMetrics(response) : metric
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart deployment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDeployment = useCallback(async (deploymentId: number) => {
    try {
      setLoading(true);
      setError(null);
      await deploymentService.deleteDeployment(deploymentId);
      const deploymentToDelete = deployments.find(d => d.id === deploymentId);
      setDeployments(prev => prev.filter(dep => dep.id !== deploymentId));
      if (deploymentToDelete) {
        setMetricsData(prev => prev.filter(metric => metric.name !== deploymentToDelete.name));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deployment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deployments]);

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 10000);
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  return {
    deployments,
    metricsData,
    loading,
    error,
    createDeployment,
    toggleDeploymentStatus,
    restartDeployment,
    deleteDeployment,
    refreshDeployments: fetchDeployments,
  };
}