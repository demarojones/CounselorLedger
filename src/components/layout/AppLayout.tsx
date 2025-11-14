import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onClose={handleCloseSidebar}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} isSidebarCollapsed={isSidebarCollapsed} />

        {/* Mock Data Indicator */}
        {isMockMode && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-sm text-center font-medium shadow-md">
            <span className="inline-flex items-center gap-2">
              🧪 Development Mode - Using Mock Data
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
