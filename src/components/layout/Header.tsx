import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import { Menu, LogOut, Search } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const {
    notifications,
    stats,
    isLoading: notificationsLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left section - Menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a90e2] focus-visible:ring-offset-2 group"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-[#4a90e2] group-hover:text-[#2e5c8a] transition-colors" />
          </button>

          {/* Search bar - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-[300px] focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, contacts..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right section - User info and actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={stats.unread}
            isLoading={notificationsLoading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRemoveNotification={removeNotification}
            onRefresh={refreshNotifications}
          />

          {/* User info */}
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ab76c] to-[#397546] flex items-center justify-center text-white font-semibold shadow-md">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              </div>

              {/* Logout button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
