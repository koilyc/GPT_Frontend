import { useState, useEffect, useCallback } from 'react';
import { workspaceAPI, projectAPI, datasetAPI } from '../api';
import type { Workspace, Project, Dataset } from '../types';

interface UseWorkspaceDetailReturn {
  workspace: Workspace | null;
  projects: Project[];
  datasets: Dataset[];
  loading: boolean;
  error: string | null;
  totalImages: number;
  totalTasks: number;
  recentProjects: Project[];
  loadWorkspaceData: () => Promise<void>;
  createProject: (projectData: any) => Promise<void>;
  createDataset: (datasetData: any) => Promise<void>;
}

export const useWorkspaceDetail = (workspaceId: number): UseWorkspaceDetailReturn => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [workspaceData, projectsResponse, datasetsResponse] = await Promise.all([
        workspaceAPI.getById(workspaceId),
        projectAPI.getAll(workspaceId, { limit: 100, offset: 0 }),
        datasetAPI.getAll(workspaceId, { limit: 100, offset: 0 })
      ]);

      setWorkspace(workspaceData);
      setProjects(projectsResponse.projects || []);
      setDatasets(datasetsResponse.datasets || []);

    } catch (error) {
      console.error('Failed to load workspace data:', error);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

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
    datasets,
    loading,
    error,
    totalImages,
    totalTasks,
    recentProjects,
    loadWorkspaceData,
    createProject,
    createDataset,
  };
};
