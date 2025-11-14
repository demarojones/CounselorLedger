import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-4 text-xl text-gray-600">You don't have permission to access this page</p>
        <p className="mt-2 text-gray-500">
          This page is restricted to administrators only.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
