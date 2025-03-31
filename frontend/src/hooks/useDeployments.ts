// src/hooks/useDeployments.ts
import { useState, useCallback, useEffect } from 'react';
import {
  Deployment,
  DeploymentCreateRequest,
  DeploymentStatus,
  MetricsData,
  SpheronDeploymentRequest
} from '@/types/deployment.types';
import { deploymentService } from '@/services/deployment.service';
import { getSpheronClient } from '@/lib/spheron-sdk';

export function useDeployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spheronConfig, setSpheronConfig] = useState({
    apiKey: '',
    network: 'testnet' as 'testnet' | 'mainnet',
    providerProxyUrl: 'http://localhost:3040'
  });

  // Load saved Spheron configuration
  useEffect(() => {
    const storedConfig = localStorage.getItem('spheron_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setSpheronConfig(prev => ({
          ...prev,
          apiKey: config.apiKey || prev.apiKey,
          network: config.network || prev.network,
          providerProxyUrl: config.providerProxyUrl || prev.providerProxyUrl
        }));
      } catch (e) {
        console.error('Error loading Spheron config:', e);
      }
    }
  }, []);

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

      // For Spheron deployments, fetch additional info
      const spheronDeployments = response.filter(d => d.provider === 'spheron' && d.provider_deployment_id);
      if (spheronDeployments.length > 0 && spheronConfig.apiKey) {
        const client = getSpheronClient(
          spheronConfig.network, 
          spheronConfig.apiKey,
          spheronConfig.providerProxyUrl
        );
        
        // Update Spheron deployment details in the background
        spheronDeployments.forEach(async (deployment) => {
          try {
            if (!deployment.provider_deployment_id) return;
            
            const details = await client.getDeployment(deployment.provider_deployment_id);
            
            // Update local state with latest info
            setDeployments(prev => prev.map(d => 
              d.id === deployment.id 
                ? { 
                    ...d, 
                    status: details.status === 'active' ? 'running' : details.status,
                    endpoint_url: details.url || d.endpoint_url
                  } 
                : d
            ));
          } catch (e) {
            console.error(`Error fetching Spheron deployment details for ${deployment.id}:`, e);
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
    } finally {
      setLoading(false);
    }
  }, [spheronConfig]);

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

  const createSpheronDeployment = useCallback(async (data: SpheronDeploymentRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await deploymentService.createSpheronDeployment(data);
      setDeployments(prev => [response, ...prev]);
      setMetricsData(prev => [transformMetrics(response), ...prev]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Spheron deployment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDeploymentStatus = useCallback(async (deploymentId: number, currentStatus: DeploymentStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle Spheron deployments differently
      const deployment = deployments.find(d => d.id === deploymentId);
      if (deployment?.provider === 'spheron' && deployment.provider_deployment_id) {
        const client = getSpheronClient(
          spheronConfig.network,
          spheronConfig.apiKey,
          spheronConfig.providerProxyUrl
        );
        
        if (currentStatus === 'running') {
          // Stop Spheron deployment
          await client.closeDeployment(deployment.provider_deployment_id);
          
          // Update local state
          setDeployments(prev => prev.map(dep => 
            dep.id === deploymentId ? {...dep, status: 'stopped'} : dep
          ));
          
          setMetricsData(prev => prev.map(metric => 
            metric.name === deployment.name ? {...metric, cpu: 0, memory: 0, requests: 0} : metric
          ));
          
          return;
        } else {
          // We would need to redeploy
          setError("Restarting a stopped Spheron deployment requires redeployment");
          setLoading(false);
          return;
        }
      }
      
      // Default handling for local deployments
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
  }, [deployments, spheronConfig]);

  const restartDeployment = useCallback(async (deploymentId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle Spheron deployments differently
      const deployment = deployments.find(d => d.id === deploymentId);
      if (deployment?.provider === 'spheron' && deployment.provider_deployment_id) {
        setError("Restarting a Spheron deployment requires redeployment");
        setLoading(false);
        return;
      }
      
      // Default handling for local deployments
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
  }, [deployments]);

  const deleteDeployment = useCallback(async (deploymentId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle Spheron deployments differently
      const deployment = deployments.find(d => d.id === deploymentId);
      if (deployment?.provider === 'spheron' && deployment.provider_deployment_id) {
        const client = getSpheronClient(
          spheronConfig.network,
          spheronConfig.apiKey,
          spheronConfig.providerProxyUrl
        );
        
        // Close the Spheron deployment first
        try {
          await client.closeDeployment(deployment.provider_deployment_id);
        } catch (e) {
          console.warn(`Error closing Spheron deployment ${deployment.provider_deployment_id}:`, e);
          // Continue with deletion even if closing fails
        }
      }
      
      // Delete from our backend
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
  }, [deployments, spheronConfig]);

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  return {
    deployments,
    metricsData,
    loading,
    error,
    createDeployment,
    createSpheronDeployment,
    toggleDeploymentStatus,
    restartDeployment,
    deleteDeployment,
    refreshDeployments: fetchDeployments,
    updateSpheronConfig: setSpheronConfig,
    spheronConfig
  };
}