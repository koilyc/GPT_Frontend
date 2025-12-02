import { useState, useEffect } from 'react';
import { workspaceAPI } from '../api';
import type { Workspace, PaginationParams, WorkspaceListResponse } from '../types';

export const useWorkspaces = (initialParams?: PaginationParams) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    ...initialParams
  });

  const loadWorkspaces = async (newParams?: PaginationParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchParams = newParams || params;
      const response: WorkspaceListResponse = await workspaceAPI.getAll(searchParams);
      
      setWorkspaces(response.workspaces);
      setTotalCount(response.total_count);
      
      if (newParams) {
        setParams(newParams);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError('Failed to load workspaces');
      setWorkspaces([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (data: { name: string; description?: string }) => {
    try {
      const newWorkspace = await workspaceAPI.create(data);
      // 重新載入以保持分頁一致性
      await loadWorkspaces();
      return newWorkspace;
    } catch (err) {
      console.error('Failed to create workspace:', err);
      throw err;
    }
  };

  const updateWorkspace = async (id: string, data: { name?: string; description?: string }) => {
    try {
      const updatedWorkspace = await workspaceAPI.update(id, data);
      setWorkspaces(prev => 
        prev.map(ws => ws.id === parseInt(id) ? updatedWorkspace : ws)
      );
      return updatedWorkspace;
    } catch (err) {
      console.error('Failed to update workspace:', err);
      throw err;
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      await workspaceAPI.delete(id);
      // 重新載入以保持分頁一致性
      await loadWorkspaces();
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      throw err;
    }
  };

  // 分頁控制功能
  const goToPage = (page: number) => {
    const newParams = { ...params, page };
    loadWorkspaces(newParams);
  };

  const changePageSize = (limit: number) => {
    const newParams = { ...params, limit, page: 1 };
    loadWorkspaces(newParams);
  };

  const searchWorkspaces = (search: string) => {
    const newParams = { ...params, search, page: 1 };
    loadWorkspaces(newParams);
  };

  const sortWorkspaces = (sort_by: string, order: 'asc' | 'desc') => {
    const newParams = { ...params, sort_by, order, page: 1 };
    loadWorkspaces(newParams);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  return {
    workspaces,
    totalCount,
    isLoading,
    error,
    params,
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    goToPage,
    changePageSize,
    searchWorkspaces,
    sortWorkspaces,
  };
};
