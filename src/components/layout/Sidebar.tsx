import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  Contact,
  FileText,
  Settings,
  X,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('ADMIN' | 'COUNSELOR')[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Interactions',
    path: '/interactions',
    icon: MessageSquare,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Calendar',
    path: '/calendar',
    icon: Calendar,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Students',
    path: '/students',
    icon: Users,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Contacts',
    path: '/contacts',
    icon: Contact,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: FileText,
    roles: ['ADMIN', 'COUNSELOR'],
  },
  {
    name: 'Admin',
    path: '/admin',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

export function Sidebar({ isOpen, isCollapsed, isMobile, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navigationItems.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const sidebarWidth = isCollapsed && !isMobile ? 'w-20' : 'w-72';
  const showLabels = !isCollapsed || isMobile;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out shadow-2xl',
          sidebarWidth,
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 static'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div
            className={cn(
              'flex items-center border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm',
              showLabels ? 'justify-between p-5' : 'justify-center p-4'
            )}
          >
            {showLabels ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-white text-lg leading-tight">Counselor</h1>
                    <p className="text-xs text-slate-400 font-medium">Ledger</p>
                  </div>
                </div>
                {isMobile && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                )}
              </>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <ul className="space-y-1.5">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 group relative overflow-hidden',
                        showLabels ? 'justify-start' : 'justify-center',
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      )}
                      title={!showLabels ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                      )}
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-transform duration-200 relative z-10',
                          isActive
                            ? 'text-white scale-110'
                            : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                        )}
                      />
                      {showLabels && (
                        <span
                          className={cn(
                            'font-medium text-sm relative z-10',
                            isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                          )}
                        >
                          {item.name}
                        </span>
                      )}
                      {isActive && showLabels && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50 relative z-10" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          {user && showLabels && (
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed user avatar */}
          {user && !showLabels && (
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
