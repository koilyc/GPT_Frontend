import { useState, useEffect, useCallback } from 'react';
import { workspaceAPI, projectAPI, datasetAPI } from '../api';
import type { Workspace, Project, Dataset, PaginationParams } from '../types';

interface UseWorkspaceDetailReturn {
  workspace: Workspace | null;
  projects: Project[];
  projectsTotalCount: number;
  datasets: Dataset[];
  datasetsTotalCount: number;
  loading: boolean;
  error: string | null;
  totalImages: number;
  totalTasks: number;
  recentProjects: Project[];
  loadWorkspaceData: () => Promise<void>;
  loadProjects: (params?: PaginationParams) => Promise<void>;
  loadDatasets: (params?: PaginationParams) => Promise<void>;
  createProject: (projectData: any) => Promise<void>;
  createDataset: (datasetData: any) => Promise<void>;
}

export const useWorkspaceDetail = (workspaceId: number): UseWorkspaceDetailReturn => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsTotalCount, setProjectsTotalCount] = useState(0);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsTotalCount, setDatasetsTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async (params?: PaginationParams) => {
    const response = await projectAPI.getAll(workspaceId, {
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
      order_by: params?.order_by ?? 'created_at',
      desc: params?.desc ?? true,
    });

    setProjects(response.projects || []);
    setProjectsTotalCount(response.total_count || 0);
  }, [workspaceId]);

  const loadDatasets = useCallback(async (params?: PaginationParams) => {
    const response = await datasetAPI.getAll(workspaceId, {
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
      order_by: params?.order_by ?? 'created_at',
      desc: params?.desc ?? true,
    });

    setDatasets(response.datasets || []);
    setDatasetsTotalCount(response.total_count || 0);
  }, [workspaceId]);

  const loadWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [workspaceData] = await Promise.all([
        workspaceAPI.getById(workspaceId),
        loadProjects(),
        loadDatasets(),
      ]);

      setWorkspace(workspaceData);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, loadProjects, loadDatasets]);

  const createProject = useCallback(async (projectData: any) => {
    try {
      const newProject = await projectAPI.create(workspaceId, {
        ...projectData,
        workspace_id: workspaceId,
      });
      setProjects(prev => [...prev, newProject]);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error('Failed to create project. Please try again.');
    }
  }, [workspaceId]);

  const createDataset = useCallback(async (datasetData: any) => {
    try {
      const newDataset = await datasetAPI.create(workspaceId, datasetData);
      setDatasets(prev => [...prev, newDataset]);
    } catch (error) {
      console.error('Failed to create dataset:', error);
      throw new Error('Failed to create dataset. Please try again.');
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId, loadWorkspaceData]);

  // Computed values
  const totalImages = projects.reduce((sum, project) => sum + (project.image_count || 0), 0);
  const totalTasks = projects.reduce((sum, project) => sum + (project.task_count || 0), 0);
  const recentProjects = projects.slice(0, 5);

  return {
    workspace,
    projects,
    projectsTotalCount,
    datasets,
    datasetsTotalCount,
    loading,
    error,
    totalImages,
    totalTasks,
    recentProjects,
    loadWorkspaceData,
    loadProjects,
    loadDatasets,
    createProject,
    createDataset,
  };
};
