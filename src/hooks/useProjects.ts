import { useState, useCallback } from 'react';
import { projectAPI } from '../api';
import type { Project, CreateProjectRequest, ProjectListResponse } from '../types';

export const useProjects = (workspaceId?: number) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response: ProjectListResponse = await projectAPI.getAll(workspaceId, { limit: 100, offset: 0 });
      setProjects(response.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const createProject = async (data: CreateProjectRequest) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      const newProject = await projectAPI.create(workspaceId, data);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  };

  const updateProject = async (projectId: number, data: Partial<CreateProjectRequest>) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      const updatedProject = await projectAPI.update(workspaceId, projectId, data);
      setProjects(prev => 
        prev.map(project => project.id === projectId ? updatedProject : project)
      );
      return updatedProject;
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  };

  const deleteProject = async (projectId: number) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    try {
      await projectAPI.delete(workspaceId, projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  };

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setProjects,
  };
};
