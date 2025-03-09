// src/hooks/useDatasets.ts
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Track if we've done the initial fetch
  const initialFetchDone = useRef(false);
  // Track if we're currently fetching to prevent duplicate requests
  const isFetching = useRef(false);

  const fetchDatasets = useCallback(async (page = currentPage, force = false) => {
    // Skip if already fetching unless forced
    if (isFetching.current && !force) {
      console.log("Already fetching datasets, skipping duplicate request");
      return [];
    }
    
    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);
      
      const response = await datasetsService.getDatasets({
        skip: page * (options.pageSize || 50),
        limit: options.pageSize || 50,
      });

      console.log("Raw datasets response:", response);
      
      if (Array.isArray(response)) {
        if (page === 0) {
          setDatasets(response);
        } else {
          setDatasets(prev => [...prev, ...response]);
        }
        setHasMore(response.length === (options.pageSize || 50));
        setCurrentPage(page);
        
        // Debug the dataset structure
        if (response.length > 0) {
          console.log("First dataset fields:", Object.keys(response[0]));
          console.log("First dataset sample:", JSON.stringify(response[0], null, 2));
        }
      } else {
        console.error("Invalid response format for datasets:", response);
      }
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      console.error('Error fetching datasets:', err);
      return [];
    } finally {
      setLoading(false);
      isFetching.current = false;
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

  // Initial fetch on mount - only run once
  useEffect(() => {
    // Only fetch if we haven't already done the initial fetch
    if (!initialFetchDone.current) {
      console.log("Performing initial datasets fetch");
      fetchDatasets(0, true);
      initialFetchDone.current = true;
    }
  }, []); // Empty dependency array ensures this only runs once

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