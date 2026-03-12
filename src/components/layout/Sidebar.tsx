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
  X
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
          'fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out shadow-2xl',
          'bg-gradient-to-b from-[#234567] via-[#2e5c8a] to-[#234567]',
          'border-r border-white/10',
          sidebarWidth,
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 static'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div
            className={cn(
              'flex items-center border-b border-white/10 bg-white/5 backdrop-blur-sm',
              showLabels ? 'justify-between p-5' : 'justify-center p-4'
            )}
          >
            {showLabels ? (
              <>
                <div className="flex items-center gap-3">
                  <img src="/counselor_ledger_logo.svg" alt="Beacon" className="w-10 h-10" />
                  <div>
                    <h1 className="font-bold text-white text-lg leading-tight">Beacon</h1>
                    <p className="text-xs text-white font-medium">Counseling Platform</p>
                  </div>
                </div>
                {isMobile && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#234567]"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </>
            ) : (
              <img src="/counselor_ledger_logo.svg" alt="Beacon" className="w-10 h-10" />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
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
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#234567] group relative overflow-hidden',
                        showLabels ? 'justify-start' : 'justify-center',
                        isActive
                          ? 'bg-white shadow-lg font-semibold'
                          : 'text-white hover:bg-white/10 hover:shadow-md'
                      )}
                      title={!showLabels ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-transform duration-200 relative z-10',
                          isActive
                            ? 'text-[#2e5c8a]'
                            : 'text-white group-hover:scale-105'
                        )}
                      />
                      {showLabels && (
                        <span
                          className={cn(
                            'font-medium text-sm relative z-10',
                            isActive ? 'text-[#2e5c8a]' : 'text-white'
                          )}
                        >
                          {item.name}
                        </span>
                      )}
                      {isActive && showLabels && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-[#5ab76c] shadow-lg shadow-[#5ab76c]/50 relative z-10" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          {user && showLabels && (
            <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ab76c] to-[#397546] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-blue-100 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed user avatar */}
          {user && !showLabels && (
            <div className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-sm flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ab76c] to-[#397546] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
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
