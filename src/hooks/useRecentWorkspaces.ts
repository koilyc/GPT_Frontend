import { useState, useEffect, useCallback } from 'react';
import { getRecentWorkspaces, addRecentWorkspace, removeRecentWorkspace, type RecentWorkspace } from '../utils/cookies';
import type { Workspace } from '../types';

export const useRecentWorkspaces = () => {
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent workspaces on mount
  useEffect(() => {
    const loadRecentWorkspaces = () => {
      try {
        const workspaces = getRecentWorkspaces();
        setRecentWorkspaces(workspaces);
      } catch (error) {
        console.error('Failed to load recent workspaces:', error);
        setRecentWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentWorkspaces();
  }, []);

  // Add workspace to recent list
  const addToRecent = useCallback((workspace: Workspace) => {
    const recentWorkspace = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
    };

    addRecentWorkspace(recentWorkspace);
    
    // Update local state
    const updatedWorkspaces = getRecentWorkspaces();
    setRecentWorkspaces(updatedWorkspaces);
  }, []);

  // Remove workspace from recent list
  const removeFromRecent = useCallback((workspaceId: number) => {
    removeRecentWorkspace(workspaceId);
    
    // Update local state
    const updatedWorkspaces = getRecentWorkspaces();
    setRecentWorkspaces(updatedWorkspaces);
  }, []);

  // Get formatted time ago string
  const getTimeAgo = useCallback((dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  return {
    recentWorkspaces,
    isLoading,
    addToRecent,
    removeFromRecent,
    getTimeAgo,
  };
};
