import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api';
import type { Notification, NotificationListResponse, NotificationQueryParams } from '../types';

export const useNotifications = (params?: NotificationQueryParams) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: NotificationListResponse = await notificationAPI.getAll(params, 2);
      setNotifications(response.notifications);
      setTotalCount(response.total_count);
      setUnreadCount(response.unread_count || 0);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchNotifications]);

  const getUnreadCount = useCallback(async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    totalCount,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  };
};
