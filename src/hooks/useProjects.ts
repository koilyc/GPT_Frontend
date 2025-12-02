import { useState, useCallback } from 'react';
import { projectAPI } from '../api';
import type { Project, CreateProjectRequest } from '../types';

export const useProjects = (workspaceId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const projectsData = await projectAPI.getAll(workspaceId);
      setProjects(projectsData || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const createProject = async (data: CreateProjectRequest) => {
    try {
      const newProject = await projectAPI.create(data);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, data: Partial<CreateProjectRequest>) => {
    try {
      const updatedProject = await projectAPI.update(id, data);
      setProjects(prev => 
        prev.map(project => project.id === parseInt(id) ? updatedProject : project)
      );
      return updatedProject;
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectAPI.delete(id);
      setProjects(prev => prev.filter(project => project.id !== parseInt(id)));
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
