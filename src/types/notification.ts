export type NotificationType = 
  | 'follow_up_due'
  | 'follow_up_overdue'
  | 'crisis_intervention'
  | 'new_interaction'
  | 'system_alert'
  | 'reminder';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string; // ID of related student, interaction, etc.
  relatedType?: 'student' | 'interaction' | 'contact';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  overdue: number;
}