// src/hooks/useDatasets.ts
import { useState, useCallback } from 'react';
import { Dataset } from '@/types/dataset.types';
import { datasetsService } from '@/services/datasets.service';

interface UseDatasetOptions {
  initialPage?: number;
  pageSize?: number;
}

export function useDatasets(options: UseDatasetOptions = {}) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(options.initialPage || 0);
  const [hasMore, setHasMore] = useState(true);

  const fetchDatasets = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await datasetsService.getDatasets({
        skip: page * (options.pageSize || 50),
        limit: options.pageSize || 50,
      });

      if (Array.isArray(response)) {
        if (page === 0) {
          setDatasets(response);
        } else {
          setDatasets(prev => [...prev, ...response]);
        }
        setHasMore(response.length === (options.pageSize || 50));
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, options.pageSize]);

  const uploadDataset = useCallback(async (
    file: File, 
    name?: string, 
    description?: string, 
    format?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await datasetsService.uploadDataset(file, name, description, format);
      
      // Add the new dataset to the list
      if (response) {
        setDatasets(prev => [response, ...prev]);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload dataset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDataset = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      await datasetsService.deleteDataset(id);
      setDatasets(prev => prev.filter(dataset => dataset.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dataset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchDatasets(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchDatasets]);

  return {
    datasets,
    loading,
    error,
    hasMore,
    fetchDatasets,
    uploadDataset,
    deleteDataset,
    loadMore,
  };
}