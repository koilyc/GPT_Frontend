import { useState, useEffect } from 'react';
import { workspaceAPI } from '../api';
import type { Workspace, WorkspaceQueryParams, WorkspaceListResponse } from '../types';

export const useWorkspaces = (initialParams?: WorkspaceQueryParams) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<WorkspaceQueryParams>({
    offset: 0,
    limit: 10,
    order_by: 'id',
    desc: false,
    ...initialParams
  });

  const loadWorkspaces = async (newParams?: WorkspaceQueryParams) => {
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

  const updateWorkspace = async (id: number, data: { name?: string; description?: string }) => {
    try {
      const updatedWorkspace = await workspaceAPI.update(id, data);
      setWorkspaces(prev => 
        prev.map(ws => ws.id === id ? updatedWorkspace : ws)
      );
      return updatedWorkspace;
    } catch (err) {
      console.error('Failed to update workspace:', err);
      throw err;
    }
  };

  const deleteWorkspace = async (id: number) => {
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
    const offset = (page - 1) * (params.limit || 10);
    const newParams = { ...params, offset };
    loadWorkspaces(newParams);
  };

  const changePageSize = (limit: number) => {
    const newParams = { ...params, limit, offset: 0 };
    loadWorkspaces(newParams);
  };

  const searchWorkspaces = (keyword: string) => {
    const newParams = { ...params, keyword, offset: 0 };
    loadWorkspaces(newParams);
  };

  const sortWorkspaces = (order_by: 'id' | 'name' | 'created_at' | 'updated_at', desc: boolean) => {
    const newParams = { ...params, order_by, desc, offset: 0 };
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
