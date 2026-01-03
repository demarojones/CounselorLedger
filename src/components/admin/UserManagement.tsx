import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Edit, UserX, Mail } from 'lucide-react';
import { UserForm } from './UserForm';
import { UserInvitationForm } from './UserInvitationForm';
import { InvitationManagement } from './InvitationManagement';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInvitationFormOpen, setIsInvitationFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure we have current user context with tenant information
      if (!currentUser?.tenantId) {
        setError('Unable to determine tenant context');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', currentUser.tenantId) // Ensure tenant boundary
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform DB response to User type
      const transformedUsers: User[] = (data || []).map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        tenantId: u.tenant_id,
        isActive: u.is_active,
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at),
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleInviteUser = () => {
    setIsInvitationFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchUsers();
  };

  const handleInvitationSent = () => {
    // Refresh any invitation-related data if needed
    // The InvitationManagement component will handle its own refresh
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      // Ensure we have current user context with tenant information
      if (!currentUser?.tenantId) {
        alert('Unable to determine tenant context');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
        .eq('tenant_id', currentUser.tenantId); // Ensure tenant boundary

      if (updateError) throw updateError;

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert('Failed to deactivate user');
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">
              Manage counselor and admin accounts. We recommend using invitations for secure user
              onboarding.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInviteUser}>
              <Mail className="w-4 h-4 mr-2" />
              Invite User
            </Button>
            <Button variant="outline" onClick={handleCreateUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User Directly
            </Button>
          </div>
        </div>

        {/* Information about invitation system */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Recommended: Use Invitations</h3>
              <p className="text-sm text-blue-700 mt-1">
                Inviting users is the secure way to onboard new team members. Users receive an email
                with a secure link to create their own account and password.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {user.isActive && user.id !== currentUser.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pending Invitations Section */}
        <InvitationManagement onInvitationChange={handleInvitationSent} />
      </div>

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSuccess={handleFormSuccess}
      />

      <UserInvitationForm
        open={isInvitationFormOpen}
        onOpenChange={setIsInvitationFormOpen}
        onInvitationSent={handleInvitationSent}
      />
    </>
  );
}
