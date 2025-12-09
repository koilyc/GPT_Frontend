import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, FilterIcon } from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import { Pagination } from '../ui/Pagination';
import { notificationAPI } from '../../api';
import type { Notification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
    loadNotifications();
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [currentPage, pageSize]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      let params: any = { 
        limit: pageSize, 
        offset: offset,
        order_by: 'created_at',
        desc: true
      };
      
      if (filter === 'unread') {
        params.read_at = 'exclude';
      } else {
        // filter === 'all'
        params.read_at = 'include';
      }
      
      const response = await notificationAPI.getAll(params);
      setNotifications(response.notifications || []);
      setTotalCount(response.total_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationColor = (notification: Notification) => {
    const event = notification.event_name || notification.event || '';
    if (!event) return 'text-blue-600 bg-blue-100';
    const eventLower = event.toLowerCase();
    if (eventLower.includes('error') || eventLower.includes('fail')) return 'text-red-600 bg-red-100';
    if (eventLower.includes('warn')) return 'text-yellow-600 bg-yellow-100';
    if (eventLower.includes('success') || eventLower.includes('complete')) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (loading && notifications.length === 0) {
    return (
      <Layout>
        <LoadingState message="Loading notifications..." />
      </Layout>
    );
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Notifications 🔔
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllAsRead} variant="outline">
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content with Fixed Pagination */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Filters */}
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {notifications.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} notifications
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`
                  transition-all hover:shadow-md
                  ${!notification.read_at ? 'border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : ''}
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification)}`}>
                        <BellIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {notification.event_name || notification.event || 'Notification'}
                          </h3>
                          {!notification.read_at && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        {notification.message && (() => {
                          const { task_info, page_info, ...otherFields } = notification.message;
                          
                          return (
                            <div className="text-gray-600 dark:text-gray-400 mb-2 space-y-2">
                              {/* Display main message fields */}
                              {Object.keys(otherFields).length > 0 && (
                                <div className="space-y-1">
                                  {Object.entries(otherFields).map(([key, value]) => {
                                    // Skip nested objects and null values
                                    if (typeof value === 'object' || value == null) return null;
                                    return (
                                      <div key={key} className="text-sm">
                                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                        <span>{String(value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Display task_info if present */}
                              {task_info && typeof task_info === 'object' && (
                                <div className="border-l-2 border-blue-300 dark:border-blue-700 pl-3 space-y-1">
                                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Task Info</div>
                                  {Object.entries(task_info).map(([key, value]) => {
                                    if (value === null || value === undefined) return null;
                                    return (
                                      <div key={key} className="text-sm">
                                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                        <span>{String(value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

              {notifications.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BellIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {filter === 'unread' 
                        ? 'All caught up! No unread notifications.' 
                        : 'You don\'t have any notifications yet.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {/* Fixed Pagination */}
          {totalCount > pageSize && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
