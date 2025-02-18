// src/hooks/usePlatformDashboard.ts

import { useState, useEffect } from 'react';
import { platformService, BasicStats } from '@/services/platform.service';

export function usePlatformDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BasicStats>({
    models: 0,
    datasets: 0,
    deployments: 0,
    activeTraining: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await platformService.getBasicStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    loading,
    error,
    stats,
    refresh: fetchData,
  };
}