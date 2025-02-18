import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Loader2,
  AlertCircle,
  Brain,
  Database,
  Rocket,
  BarChart2,
  LineChart,
} from 'lucide-react';
import { usePlatformDashboard } from '@/hooks/usePlatformDashboard';

export const HomePage: React.FC = () => {
  const {
    loading,
    error,
    stats,
    refresh
  } = usePlatformDashboard();

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ML Platform Dashboard</h1>
        <Button onClick={refresh} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Models</p>
                <p className="text-2xl font-bold">{stats.models || 0}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Datasets</p>
                <p className="text-2xl font-bold">{stats.datasets || 0}</p>
              </div>
              <Database className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Deployments</p>
                <p className="text-2xl font-bold">{stats.deployments || 0}</p>
              </div>
              <Rocket className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Training Jobs</p>
                <p className="text-2xl font-bold">{stats.activeTraining || 0}</p>
              </div>
              <BarChart2 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/models">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Brain className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium">Create Model</h3>
                  <p className="text-sm text-gray-500">Train a new ML model</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/datasets">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Database className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="font-medium">Upload Dataset</h3>
                  <p className="text-sm text-gray-500">Add new training data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/deployment">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Rocket className="w-6 h-6 text-purple-500" />
                <div>
                  <h3 className="font-medium">Deploy Model</h3>
                  <p className="text-sm text-gray-500">Deploy to production</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/evaluation">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <LineChart className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-medium">Evaluate Model</h3>
                  <p className="text-sm text-gray-500">Test model performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;