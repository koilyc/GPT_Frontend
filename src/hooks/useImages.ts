import { useState, useEffect, useCallback } from 'react';
import { imageAPI } from '../api';
import type { Image, ImageListResponse, PaginationParams } from '../types';

export const useImages = (
  workspaceId?: number,
  datasetId?: number,
  params?: PaginationParams
) => {
  const [images, setImages] = useState<Image[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = useCallback(async () => {
    if (!workspaceId || !datasetId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response: ImageListResponse = await imageAPI.getAll(workspaceId, datasetId, params);
      setImages(response.Images);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, datasetId, params]);

  const uploadImage = useCallback(async (name: string, imageMetadata: any, file: File) => {
    if (!workspaceId || !datasetId) return;
    
    try {
      const newImage = await imageAPI.upload(workspaceId, datasetId, name, imageMetadata, file);
      await fetchImages();
      return newImage;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, datasetId, fetchImages]);

  const updateImage = useCallback(async (imageId: number, data: Partial<Image>) => {
    if (!workspaceId || !datasetId) return;
    
    try {
      const updatedImage = await imageAPI.update(workspaceId, datasetId, imageId, data);
      setImages(images.map(img => img.id === imageId ? updatedImage : img));
      return updatedImage;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, datasetId, images]);

  const deleteImage = useCallback(async (imageId: number) => {
    if (!workspaceId || !datasetId) return;
    
    try {
      await imageAPI.delete(workspaceId, datasetId, imageId);
      setImages(images.filter(img => img.id !== imageId));
      setTotalCount(totalCount - 1);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, datasetId, images, totalCount]);

  const getImageUrl = useCallback(async (imageId: number) => {
    if (!workspaceId || !datasetId) return null;
    
    try {
      const response = await imageAPI.getContentUrl(workspaceId, datasetId, imageId);
      return response.presigned_url;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, datasetId]);

  const getThumbnailUrl = useCallback(async (imageId: number) => {
    if (!workspaceId || !datasetId) return null;
    
    try {
      const response = await imageAPI.getThumbnailUrl(workspaceId, datasetId, imageId);
      return response.presigned_url;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [workspaceId, datasetId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    totalCount,
    loading,
    error,
    refetch: fetchImages,
    uploadImage,
    updateImage,
    deleteImage,
    getImageUrl,
    getThumbnailUrl,
  };
};
