import { useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationStats } from '@/types/notification';
import {
  generateNotifications,
  getStoredNotifications,
  saveNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  getNotificationStats,
  cleanupExpiredNotifications,
} from '@/services/notificationService';
import { fetchStudents, fetchInteractions } from '@/services/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load and refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clean up expired notifications first
      cleanupExpiredNotifications();

      // Get stored notifications
      const storedNotifications = getStoredNotifications();

      // Generate new notifications from current data
      const [studentsResponse, interactionsResponse] = await Promise.all([
        fetchStudents(),
        fetchInteractions(),
      ]);

      if (studentsResponse.data && interactionsResponse.data) {
        const newNotifications = generateNotifications(
          interactionsResponse.data,
          studentsResponse.data
        );

        // Merge with stored notifications, avoiding duplicates
        const existingIds = new Set(storedNotifications.map(n => n.id));
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));

        const allNotifications = [...storedNotifications, ...uniqueNewNotifications];

        // Sort by priority and date
        const sortedNotifications = allNotifications.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        setNotifications(sortedNotifications);
        setStats(getNotificationStats(sortedNotifications));
        saveNotifications(sortedNotifications);
      } else {
        // If API fails, just use stored notifications
        setNotifications(storedNotifications);
        setStats(getNotificationStats(storedNotifications));
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Fallback to stored notifications
      const storedNotifications = getStoredNotifications();
      setNotifications(storedNotifications);
      setStats(getNotificationStats(storedNotifications));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)));
    setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setStats(prev => ({ ...prev, unread: 0 }));
  }, []);

  // Remove notification
  const removeNotificationById = useCallback((notificationId: string) => {
    removeNotification(notificationId);
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      setStats(getNotificationStats(updated));
      return updated;
    });
  }, []);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return {
    notifications,
    stats,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification: removeNotificationById,
  };
}
