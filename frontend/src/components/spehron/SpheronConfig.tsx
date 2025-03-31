import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { getSpheronClient } from '@/lib/spheron-sdk';

interface SpheronConfigProps {
  onConfigChange: (config: { apiKey: string; network: 'testnet' | 'mainnet'; providerProxyUrl: string }) => void;
}

export const SpheronConfig: React.FC<SpheronConfigProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [providerProxyUrl, setProviderProxyUrl] = useState('http://localhost:3040');
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    // Try to load stored configuration
    const storedConfig = localStorage.getItem('spheron_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setApiKey(config.apiKey || '');
        setNetwork(config.network || 'testnet');
        setProviderProxyUrl(config.providerProxyUrl || 'http://localhost:3040');
      } catch (e) {
        console.error('Error loading Spheron config:', e);
      }
    }
  }, []);

  const saveConfig = () => {
    try {
      const config = { apiKey, network, providerProxyUrl };
      localStorage.setItem('spheron_config', JSON.stringify(config));
      onConfigChange(config);
    } catch (e) {
      console.error('Error saving Spheron config:', e);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(false);
    setBalance(null);
    
    try {
      const client = getSpheronClient(network, apiKey, providerProxyUrl);
      const result = await client.getBalance();
      setBalance(result.toString());
      setSuccess(true);
      saveConfig();
    } catch (e) {
      console.error('Error testing Spheron connection:', e);
      setError(e instanceof Error ? e.message : 'Unknown connection error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Spheron Configuration</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Spheron API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your Spheron API key"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Network"
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
              placeholder="testnet or mainnet"
            />
            <Input
              label="Provider Proxy URL"
              value={providerProxyUrl}
              onChange={(e) => setProviderProxyUrl(e.target.value)}
              placeholder="http://localhost:3040"
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
              <AlertDescription>
                Connected successfully to Spheron!
                {balance && <div>Available balance: {balance}</div>}
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
              disabled={!apiKey || testing}
            >
              {testing ? (
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
  );
};