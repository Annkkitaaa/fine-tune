// src/components/TrainingDetailsDialog.tsx
import React from 'react';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { AlertCircle, Server, Cpu, Memory } from 'lucide-react';
import { Training } from '@/types/training.types';
import { useTrainingUtils } from '@/hooks/useTrainingUtils';
import { MetricsVisualization } from '@/components/MetricsVisualization';

interface TrainingDetailsDialogProps {
  training: Training | null;
  modelName: string;
  datasetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TrainingDetailsDialog: React.FC<TrainingDetailsDialogProps> = ({
  training,
  modelName,
  datasetName,
  isOpen,
  onClose
}) => {
  const utils = useTrainingUtils();
  
  if (!training) return null;
  
  // Generate history data for charts
  const historyData = React.useMemo(() => {
    if (!training.metrics?.history) return [];
    
    const { train_loss, val_loss } = training.metrics.history;
    
    return train_loss.map((loss, index) => ({
      epoch: index + 1,
      train_loss: loss,
      val_loss: val_loss ? val_loss[index] : undefined
    }));
  }, [training.metrics?.history]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Training Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium">{modelName}</h3>
              <p className="text-sm text-gray-500">Dataset: {datasetName}</p>
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${utils.getStatusColor(
                  training.status
                )}`}
              >
                {training.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                ID: {training.id}
              </p>
            </div>
          </div>
          
          {/* Progress */}
          {(training.status === 'running' || training.status === 'queued') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {training.epochs_completed || 0}/{training.hyperparameters?.epochs || 0} epochs 
                  ({utils.calculateProgress(training)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${utils.calculateProgress(training)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Charts */}
          {historyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="text-md font-medium">Training Loss</h3>
                </CardHeader>
                <CardContent>
                  <MetricsVisualization
                    type="line"
                    data={historyData}
                    title="Loss Over Time"
                    xKey="epoch"
                    yKey="train_loss"
                    height={200}
                  />
                </CardContent>
              </Card>
              
              {training.metrics?.history?.val_loss && (
                <Card>
                  <CardHeader>
                    <h3 className="text-md font-medium">Validation Loss</h3>
                  </CardHeader>
                  <CardContent>
                    <MetricsVisualization
                      type="line"
                      data={historyData}
                      title="Validation Loss"
                      xKey="epoch"
                      yKey="val_loss"
                      height={200}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Resource Metrics */}
          {training.status === 'running' && training.metrics && (
            <Card>
              <CardHeader>
                <h3 className="text-md font-medium">Resource Usage</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">CPU Usage</p>
                      <p className="font-medium">{utils.formatPercentage(training.metrics.cpu_usage)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Memory className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Memory Usage</p>
                      <p className="font-medium">{utils.formatPercentage(training.metrics.memory_usage)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">GPU Usage</p>
                      <p className="font-medium">{utils.formatPercentage(training.metrics.gpu_usage)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Hyperparameters */}
          <Card>
            <CardHeader>
              <h3 className="text-md font-medium">Hyperparameters</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Learning Rate</p>
                  <p className="font-medium">{training.hyperparameters?.learning_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Batch Size</p>
                  <p className="font-medium">{training.hyperparameters?.batch_size}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Epochs</p>
                  <p className="font-medium">{training.hyperparameters?.epochs}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Optimizer</p>
                  <p className="font-medium">{training.hyperparameters?.optimizer?.name.toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Duration and Time */}
          <Card>
            <CardHeader>
              <h3 className="text-md font-medium">Timing Information</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Started At</p>
                  <p className="font-medium">
                    {training.start_time ? new Date(training.start_time).toLocaleString() : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium">{utils.formatDuration(training.duration)}</p>
                </div>
                {training.status === 'running' && (
                  <div>
                    <p className="text-xs text-gray-500">Estimated Completion</p>
                    <p className="font-medium">{utils.getEstimatedCompletionTime(training)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Error Message */}
          {training.error_message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{training.error_message}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};