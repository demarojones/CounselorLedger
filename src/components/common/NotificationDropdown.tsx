import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCheck, 
  X,
  ExternalLink,
  Trash2
} from 'lucide-react';
import type { Notification, NotificationPriority } from '@/types/notification';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
  onRefresh: () => void;
}

const priorityColors = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-blue-600 bg-blue-50 border-blue-200',
  low: 'text-gray-600 bg-gray-50 border-gray-200',
};

const typeIcons = {
  follow_up_due: Clock,
  follow_up_overdue: AlertTriangle,
  crisis_intervention: AlertTriangle,
  new_interaction: MessageSquare,
  system_alert: Bell,
  reminder: User,
};

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onRemove 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(notification.id);
  };

  const content = (
    <div
      className={cn(
        'p-3 border-l-4 transition-all duration-200 hover:bg-gray-50',
        priorityColors[notification.priority],
        !notification.isRead && 'bg-blue-50/50'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn(
          'w-5 h-5 mt-0.5 flex-shrink-0',
          notification.priority === 'urgent' ? 'text-red-600' :
          notification.priority === 'high' ? 'text-orange-600' :
          notification.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
        )} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                'text-sm font-medium',
                !notification.isRead && 'font-semibold'
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  {notification.createdAt.toLocaleString()}
                </span>
                {notification.actionLabel && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {notification.actionLabel}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Mark as read"
                >
                  <CheckCheck className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <button
                onClick={handleRemove}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Remove notification"
              >
                <Trash2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link 
        to={notification.actionUrl}
        className="block hover:no-underline"
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification,
  onRefresh,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const urgentNotifications = notifications.filter(n => n.priority === 'urgent');
  const recentNotifications = notifications.slice(0, 10); // Show latest 10

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No notifications</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Urgent notifications first */}
                {urgentNotifications.length > 0 && (
                  <div className="bg-red-50 border-b-2 border-red-200">
                    <div className="p-3 bg-red-100">
                      <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Urgent ({urgentNotifications.length})
                      </h4>
                    </div>
                    {urgentNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onRemove={onRemoveNotification}
                      />
                    ))}
                  </div>
                )}

                {/* Recent notifications */}
                {recentNotifications
                  .filter(n => n.priority !== 'urgent')
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onRemove={onRemoveNotification}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Showing {Math.min(recentNotifications.length, 10)} of {notifications.length}
                </span>
                <button
                  onClick={onRefresh}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}