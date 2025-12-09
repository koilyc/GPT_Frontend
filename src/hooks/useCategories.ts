import { useState, useEffect, useCallback } from 'react';
import { categoryAPI } from '../api';
import type { Category } from '../types';

export const useCategories = (workspaceId?: number, projectId?: number) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!workspaceId || !projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await categoryAPI.getAll(workspaceId, projectId);
      setCategories(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  const createCategory = useCallback(async (name: string, color: string) => {
    if (!workspaceId || !projectId) return;
    
    try {
      const newCategory = await categoryAPI.create(workspaceId, projectId, { name, color });
      setCategories([...categories, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, categories]);

  const updateCategory = useCallback(async (categoryId: number, data: Partial<{ name: string; color: string }>) => {
    if (!workspaceId || !projectId) return;
    
    try {
      const updatedCategory = await categoryAPI.update(workspaceId, projectId, categoryId, data);
      setCategories(categories.map(c => c.id === categoryId ? updatedCategory : c));
      return updatedCategory;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, categories]);

  const deleteCategory = useCallback(async (categoryId: number) => {
    if (!workspaceId || !projectId) return;
    
    try {
      await categoryAPI.delete(workspaceId, projectId, categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
