
import { useState, useCallback } from 'react';
import { modelsService } from '@/services/models.service';
import { Model, ModelCreateRequest } from '@/types/model.types';

interface UseModelsOptions {
  pageSize?: number;
}

export function useModels(options: UseModelsOptions = {}) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await modelsService.getModels();
      setModels(response);
      setHasMore(response.length >= (options.pageSize || 50));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, [options.pageSize]);

  const createModel = useCallback(async (data: ModelCreateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await modelsService.createModel(data);
      setModels(prev => [response, ...prev]);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteModel = useCallback(async (modelId: number) => {
    try {
      setLoading(true);
      setError(null);
      await modelsService.deleteModel(modelId);
      setModels(prev => prev.filter(model => model.id !== modelId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    models,
    loading,
    error,
    hasMore,
    fetchModels,
    createModel,
    deleteModel,
  };
}