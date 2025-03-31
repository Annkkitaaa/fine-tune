// src/pages/SpheronSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Server,
  Settings
} from 'lucide-react';
import { getSpheronClient } from '@/lib/spheron-sdk';

export const SpheronSettingsPage: React.FC = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    network: 'testnet' as 'testnet' | 'mainnet',
    providerProxyUrl: 'http://localhost:3040',
    autoScaling: false
  });
  
  const [proxyStatus, setProxyStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('spheron_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error parsing saved Spheron config:', e);
      }
    }
    
    // Check proxy status
    checkProxyStatus();
  }, []);
  
  const checkProxyStatus = async () => {
    setProxyStatus('checking');
    try {
      const response = await fetch(config.providerProxyUrl, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      setProxyStatus('online');
    } catch (error) {
      console.error('Proxy server check failed:', error);
      setProxyStatus('offline');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setConfig(prev => ({ ...prev, [name]: checked }));
  };

  const saveConfig = () => {
    try {
      localStorage.setItem('spheron_config', JSON.stringify(config));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving config:', e);
      setError('Failed to save configuration');
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setBalance(null);
    
    try {
      const client = getSpheronClient(
        config.network, 
        config.apiKey, 
        config.providerProxyUrl
      );
      
      const balanceInfo = await client.getBalance();
      setBalance(balanceInfo.toString());
      saveConfig();
    } catch (e) {
      console.error('Error testing Spheron connection:', e);
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spheron Settings</h1>
        <Button 
          variant="outline" 
          onClick={checkProxyStatus}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${proxyStatus === 'checking' ? 'animate-spin' : ''}`} />
          Check Proxy
        </Button>
      </div>

      {proxyStatus === 'offline' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Provider Proxy Server is offline. Please start the server at {config.providerProxyUrl}.
          </AlertDescription>
        </Alert>
      )}
      
      {proxyStatus === 'online' && (
        <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Provider Proxy Server is online at {config.providerProxyUrl}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Spheron Protocol Configuration</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="API Key"
                name="apiKey"
                type="password"
                value={config.apiKey}
                onChange={handleInputChange}
                placeholder="Enter your Spheron API key"
              />
              
              <Input
                label="Provider Proxy URL"
                name="providerProxyUrl"
                value={config.providerProxyUrl}
                onChange={handleInputChange}
                placeholder="http://localhost:3040"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Network</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="network"
                      value="testnet"
                      checked={config.network === 'testnet'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Testnet
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="network"
                      value="mainnet"
                      checked={config.network === 'mainnet'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Mainnet
                  </label>
                </div>
              </div>
              
              <Switch
                label="Enable Auto-Scaling"
                checked={config.autoScaling}
                onChange={(checked) => handleSwitchChange('autoScaling', checked)}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Configuration saved successfully</AlertDescription>
              </Alert>
            )}
            
            {balance !== null && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                <Server className="h-4 w-4" />
                <AlertDescription>
                  Current Spheron balance: {balance}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={saveConfig}
              >
                Save Configuration
              </Button>
              <Button 
                onClick={testConnection}
                disabled={loading || !config.apiKey}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Deployment Defaults</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Default CPU Cores"
                name="defaultCpu"
                type="number"
                min="1"
                max="4"
                value="1"
                placeholder="1"
              />
              
              <Input
                label="Default Memory (GB)"
                name="defaultMemory"
                type="number"
                min="1"
                max="8"
                value="2"
                placeholder="2"
              />
              
              <Input
                label="Default Instances"
                name="defaultInstances"
                type="number"
                min="1"
                max="5"
                value="1"
                placeholder="1"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  // Add default settings to config
                  const updatedConfig = {
                    ...config,
                    defaultCpu: 1,
                    defaultMemory: 2,
                    defaultInstances: 1
                  };
                  setConfig(updatedConfig);
                  localStorage.setItem('spheron_config', JSON.stringify(updatedConfig));
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 3000);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpheronSettingsPage;