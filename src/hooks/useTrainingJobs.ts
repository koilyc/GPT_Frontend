import { useState, useEffect } from 'react';
import { trainingJobAPI } from '../api';
import type { TrainingJob, TrainingJobListResponse, JobQueryParams } from '../types';

export const useTrainingJobs = (workspaceId?: number) => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTrainingJobs = async (params?: JobQueryParams) => {
    if (!workspaceId) {
      setTrainingJobs([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: TrainingJobListResponse = await trainingJobAPI.getByWorkspace(workspaceId, {
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
        order_by: 'created_at',
        desc: true,
        ...params
      });
      
      // Ensure we have a valid response structure
      if (response && Array.isArray(response.jobs)) {
        setTrainingJobs(response.jobs);
        setTotalCount(response.total_count || 0);
      } else {
        // Handle case where API returns unexpected structure
        setTrainingJobs([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch training jobs');
      setTrainingJobs([]);
      setTotalCount(0);
      console.error('Error fetching training jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelTrainingJob = async (projectId: number, jobId: number) => {
    if (!workspaceId) return;

    try {
      await trainingJobAPI.cancel(workspaceId, projectId, jobId);
      // Refresh the training jobs list
      fetchTrainingJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel training job');
      console.error('Error canceling training job:', err);
    }
  };

  const deleteTrainingJob = async (projectId: number, jobId: number) => {
    if (!workspaceId) return;

    try {
      await trainingJobAPI.delete(workspaceId, projectId, jobId);
      // Refresh the training jobs list
      fetchTrainingJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete training job');
      console.error('Error deleting training job:', err);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchTrainingJobs();
    } else {
      // Reset state when no workspaceId
      setTrainingJobs([]);
      setTotalCount(0);
      setError(null);
      setLoading(false);
    }
  }, [workspaceId]);

  return {
    trainingJobs,
    loading,
    error,
    totalCount,
    fetchTrainingJobs,
    cancelTrainingJob,
    deleteTrainingJob,
    refetch: fetchTrainingJobs
  };
};

export const useProjectTrainingJobs = (workspaceId?: number, projectId?: number) => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTrainingJobs = async (params?: JobQueryParams) => {
    if (!workspaceId || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response: TrainingJobListResponse = await trainingJobAPI.getByProject(workspaceId, projectId, {
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0,
        order_by: 'created_at',
        desc: true,
        ...params
      });
      
      setTrainingJobs(response.jobs);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch training jobs');
      console.error('Error fetching project training jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && projectId) {
      fetchTrainingJobs();
    }
  }, [workspaceId, projectId]);

  return {
    trainingJobs,
    loading,
    error,
    totalCount,
    fetchTrainingJobs,
    refetch: fetchTrainingJobs
  };
};
