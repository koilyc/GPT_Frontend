import { useState, useEffect, useCallback } from 'react';
import { accountAPI } from '../api';
import type { User } from '../types';

export const useAccount = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountAPI.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const updatedProfile = await accountAPI.updateProfile(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await accountAPI.deleteAccount();
      setProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    deleteAccount,
  };
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountAPI.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Record<string, boolean>) => {
    try {
      const updatedSettings = await accountAPI.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
};
