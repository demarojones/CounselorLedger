import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats,
} from '@/types/notification';
import type { Interaction } from '@/types/interaction';
import type { Student } from '@/types/student';

const NOTIFICATIONS_KEY = 'counselor_notifications';

/**
 * Generate notifications based on interactions and students data
 */
export function generateNotifications(
  interactions: Interaction[],
  students: Student[]
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  // 1. Follow-up due notifications
  interactions.forEach(interaction => {
    if (interaction.needsFollowUp && !interaction.isFollowUpComplete && interaction.followUpDate) {
      const followUpDate = new Date(interaction.followUpDate);
      const daysDiff = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let priority: NotificationPriority = 'medium';
      let type: NotificationType = 'follow_up_due';

      if (daysDiff < 0) {
        priority = 'high';
        type = 'follow_up_overdue';
      } else if (daysDiff <= 1) {
        priority = 'high';
      }

      const student = students.find(s => s.id === interaction.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';

      notifications.push({
        id: `follow_up_${interaction.id}`,
        type,
        priority,
        title: daysDiff < 0 ? 'Overdue Follow-up' : 'Follow-up Due',
        message: `Follow-up ${daysDiff < 0 ? 'overdue' : 'due'} for ${studentName}${daysDiff < 0 ? ` (${Math.abs(daysDiff)} days ago)` : daysDiff === 0 ? ' today' : ` in ${daysDiff} days`}`,
        actionUrl: `/students/${interaction.studentId}`,
        actionLabel: 'View Student',
        relatedId: interaction.studentId ?? undefined,
        relatedType: 'student',
        isRead: false,
        createdAt: now,
      });
    }
  });

  // 2. Crisis intervention alerts (recent ones)
  const recentCrisisInteractions = interactions.filter(interaction => {
    const interactionDate = new Date(interaction.startTime);
    const hoursDiff = (now.getTime() - interactionDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24 && interaction.categoryId === '10000000-0000-0000-0000-000000000005'; // Crisis Intervention category
  });

  recentCrisisInteractions.forEach(interaction => {
    const student = students.find(s => s.id === interaction.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';

    notifications.push({
      id: `crisis_${interaction.id}`,
      type: 'crisis_intervention',
      priority: 'urgent',
      title: 'Recent Crisis Intervention',
      message: `Crisis intervention recorded for ${studentName}. Monitor for follow-up needs.`,
      actionUrl: `/interactions`,
      actionLabel: 'View Interaction',
      relatedId: interaction.id,
      relatedType: 'interaction',
      isRead: false,
      createdAt: now,
    });
  });

  // 3. Students needing attention
  const studentsNeedingAttention = students.filter(student => student.needsFollowUp);

  studentsNeedingAttention.forEach(student => {
    notifications.push({
      id: `attention_${student.id}`,
      type: 'reminder',
      priority: 'medium',
      title: 'Student Needs Attention',
      message: `${student.firstName} ${student.lastName} has been flagged for follow-up attention.`,
      actionUrl: `/students/${student.id}`,
      actionLabel: 'View Student',
      relatedId: student.id,
      relatedType: 'student',
      isRead: false,
      createdAt: now,
    });
  });

  // Sort by priority and date
  return notifications.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * Get stored notifications from localStorage
 */
export function getStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!stored) return [];

    const notifications = JSON.parse(stored);
    return notifications.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
    }));
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

/**
 * Save notifications to localStorage
 */
export function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => (n.id === notificationId ? { ...n, isRead: true } : n));
  saveNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, isRead: true }));
  saveNotifications(updated);
}

/**
 * Remove notification
 */
export function removeNotification(notificationId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.filter(n => n.id !== notificationId);
  saveNotifications(updated);
}

/**
 * Get notification statistics
 */
export function getNotificationStats(notifications: Notification[]): NotificationStats {
  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    urgent: notifications.filter(n => n.priority === 'urgent').length,
    overdue: notifications.filter(n => n.type === 'follow_up_overdue').length,
  };
}

/**
 * Clean up expired notifications
 */
export function cleanupExpiredNotifications(): void {
  const notifications = getStoredNotifications();
  const now = new Date();
  const active = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
  saveNotifications(active);
}
