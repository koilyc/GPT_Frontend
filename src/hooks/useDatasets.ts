import { useState, useCallback, useEffect } from 'react';
import { datasetAPI } from '../api';
import type { Dataset, CreateDatasetRequest } from '../types';

export const useDatasets = (workspaceId?: string) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const datasetsData = await datasetAPI.getByWorkspace(workspaceId);
      setDatasets(datasetsData || []);
    } catch (err) {
      console.error('Failed to load datasets:', err);
      setError('Failed to load datasets');
      setDatasets([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Auto-load datasets when workspaceId changes
  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const createDataset = async (data: CreateDatasetRequest) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      const newDataset = await datasetAPI.create(workspaceId, data);
      setDatasets(prev => [...prev, newDataset]);
      return newDataset;
    } catch (err) {
      console.error('Failed to create dataset:', err);
      throw err;
    }
  };

  const updateDataset = async (datasetId: number, data: Partial<CreateDatasetRequest>) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      const updatedDataset = await datasetAPI.update(workspaceId, datasetId, data);
      setDatasets(prev => 
        prev.map(dataset => dataset.id === datasetId ? updatedDataset : dataset)
      );
      return updatedDataset;
    } catch (err) {
      console.error('Failed to update dataset:', err);
      throw err;
    }
  };

  const deleteDataset = async (datasetId: number) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      await datasetAPI.delete(workspaceId, datasetId);
      setDatasets(prev => prev.filter(dataset => dataset.id !== datasetId));
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      throw err;
    }
  };

  return {
    datasets,
    isLoading,
    error,
    loadDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    setDatasets,
  };
};
