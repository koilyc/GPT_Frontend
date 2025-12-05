import { useState, useEffect, useCallback } from 'react';
import { annotationAPI } from '../api';
import type { Annotation, MultiAnnotationResponse, PaginationParams } from '../types';

export const useAnnotations = (
  workspaceId?: number, 
  projectId?: number, 
  imageId?: number
) => {
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnotation = useCallback(async () => {
    if (!workspaceId || !projectId || !imageId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await annotationAPI.getByImage(workspaceId, projectId, imageId);
      setAnnotation(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, imageId]);

  const createAnnotation = useCallback(async (data: any) => {
    if (!workspaceId || !projectId || !imageId) return;
    
    try {
      const newAnnotation = await annotationAPI.create(workspaceId, projectId, imageId, data);
      setAnnotation(newAnnotation);
      return newAnnotation;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, imageId]);

  const updateAnnotation = useCallback(async (annotationId: number, data: any) => {
    if (!workspaceId || !projectId || !imageId) return;
    
    try {
      const updatedAnnotation = await annotationAPI.update(workspaceId, projectId, imageId, annotationId, data);
      setAnnotation(updatedAnnotation);
      return updatedAnnotation;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, imageId]);

  const deleteAnnotation = useCallback(async (annotationId: number) => {
    if (!workspaceId || !projectId || !imageId) return;
    
    try {
      await annotationAPI.delete(workspaceId, projectId, imageId, annotationId);
      setAnnotation(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, projectId, imageId]);

  useEffect(() => {
    fetchAnnotation();
  }, [fetchAnnotation]);

  return {
    annotation,
    loading,
    error,
    refetch: fetchAnnotation,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
};

export const useProjectAnnotations = (
  workspaceId?: number,
  projectId?: number,
  params?: PaginationParams
) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnotations = useCallback(async () => {
    if (!workspaceId || !projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response: MultiAnnotationResponse = await annotationAPI.getAllByProject(workspaceId, projectId, params);
      setAnnotations(response.annotations);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, params]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return {
    annotations,
    totalCount,
    loading,
    error,
    refetch: fetchAnnotations,
  };
};
