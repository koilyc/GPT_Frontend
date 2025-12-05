import { useState, useEffect, useCallback } from 'react';
import { quotaAPI } from '../api';
import type { QuotaResponse } from '../types';

export const useWorkspaceQuotas = (workspaceId?: number, resourceType?: string) => {
  const [quotas, setQuotas] = useState<QuotaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuotas = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await quotaAPI.getAllQuotas(workspaceId, resourceType);
      setQuotas(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, resourceType]);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  return {
    quotas,
    loading,
    error,
    refetch: fetchQuotas,
  };
};

export const useMemberQuotas = (workspaceId?: number) => {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuota = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await quotaAPI.getMemberQuotas(workspaceId);
      setQuota(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    error,
    refetch: fetchQuota,
  };
};

export const useTrainingJobQuotas = (workspaceId?: number, startDate?: string, endDate?: string) => {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuota = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await quotaAPI.getTrainingJobQuotas(workspaceId, startDate, endDate);
      setQuota(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, startDate, endDate]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    error,
    refetch: fetchQuota,
  };
};
