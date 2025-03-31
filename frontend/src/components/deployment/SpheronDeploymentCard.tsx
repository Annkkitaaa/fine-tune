// src/components/deployment/SpheronDeploymentCard.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Deployment } from '@/types/deployment.types';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Cloud,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface SpheronDeploymentCardProps {
  deployment: Deployment;
  onToggleStatus: () => void;
  onRestart: () => void;
  onDelete: () => void;
  loading: boolean;
}

export const SpheronDeploymentCard: React.FC<SpheronDeploymentCardProps> = ({
  deployment,
  onToggleStatus,
  onRestart,
  onDelete,
  loading
}) => {
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

  const openEndpoint = () => {
    if (deployment.endpoint_url) {
      window.open(deployment.endpoint_url, '_blank');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center">
            <Cloud className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-medium">{deployment.name}</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {deployment.endpoint_url || 'Endpoint not available yet'}
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
            onClick={onToggleStatus}
            disabled={loading || !deployment.provider_deployment_id}
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
            onClick={onRestart}
            disabled={loading || !deployment.provider_deployment_id}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Provider:</span>{' '}
          <span className="font-medium">Spheron</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">ID:</span>{' '}
          <span className="font-mono text-xs">{deployment.provider_deployment_id?.substring(0, 8) || '-'}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">CPU:</span>{' '}
          {deployment.metrics?.cpu || '-'}%
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Memory:</span>{' '}
          {deployment.metrics?.memory || '-'}%
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Requests:</span>{' '}
          {deployment.metrics?.requests || '0'}/s
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Uptime:</span>{' '}
          {formatUptime(deployment.start_time)}
        </div>
      </div>
      
      <div className="flex mt-4 space-x-2">
        {deployment.endpoint_url && (
          <Button 
            size="sm"
            variant="outline"
            onClick={openEndpoint}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Endpoint
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Show logs or details
          }}
        >
          <Terminal className="w-4 h-4 mr-2" />
          View Logs
        </Button>
      </div>
    </div>
  );
};