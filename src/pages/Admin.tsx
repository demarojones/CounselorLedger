import { useState } from 'react';
import {
  UserManagement,
  ReasonManagement,
  AdminDashboard,
  TenantManagement,
} from '@/components/admin';

type AdminTab = 'dashboard' | 'users' | 'categories' | 'organization';

export function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', description: 'System-wide analytics' },
    { id: 'users' as AdminTab, label: 'User Management', description: 'Manage counselor accounts' },
    {
      id: 'categories' as AdminTab,
      label: 'Reason Categories',
      description: 'Manage interaction categories',
    },
    {
      id: 'organization' as AdminTab,
      label: 'Organization',
      description: 'View organization settings',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mt-2 text-gray-600">Manage users, settings, and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'categories' && <ReasonManagement />}
        {activeTab === 'organization' && <TenantManagement />}
      </div>
    </div>
  );
}
