import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPendingInvitations,
  cancelInvitation,
  resendInvitation,
} from '@/services/invitationService';
import type { PendingInvitation } from '@/types/setup';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Mail, MailX, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface InvitationManagementProps {
  onInvitationChange?: () => void;
}

export function InvitationManagement({ onInvitationChange }: InvitationManagementProps) {
  const { user: currentUser } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, 'cancel' | 'resend'>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getPendingInvitations();

      if (result.error) {
        setError(result.error.message || 'Failed to load invitations');
        return;
      }

      setInvitations(result.data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [invitationId]: 'cancel' }));

    try {
      const result = await cancelInvitation(invitationId);

      if (result.error) {
        setError(result.error.message || 'Failed to cancel invitation');
        return;
      }

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      setSuccessMessage(`Invitation for ${email} has been cancelled.`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Notify parent component
      onInvitationChange?.();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[invitationId];
        return newState;
      });
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setActionLoading(prev => ({ ...prev, [invitationId]: 'resend' }));

    try {
      const result = await resendInvitation(invitationId);

      if (result.error) {
        setError(result.error.message || 'Failed to resend invitation');
        return;
      }

      setSuccessMessage(`Invitation has been resent to ${email}.`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh the invitations list to get updated expiration times
      await fetchInvitations();

      // Notify parent component
      onInvitationChange?.();
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[invitationId];
        return newState;
      });
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      return 'Less than 1 hour left';
    }
  };

  const getStatusBadge = (invitation: PendingInvitation) => {
    if (invitation.isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    const timeLeft = invitation.expiresAt.getTime() - new Date().getTime();
    const hoursLeft = timeLeft / (1000 * 60 * 60);

    if (hoursLeft <= 24) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expiring Soon
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
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
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading invitations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
          <p className="text-sm text-gray-600">
            Manage user invitations that haven't been accepted yet
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No pending invitations
                </TableCell>
              </TableRow>
            ) : (
              invitations.map(invitation => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    {invitation.role === 'ADMIN' ? 'Admin User' : 'Counselor User'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invitation.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {invitation.role}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell className="text-gray-600">
                    <div>
                      <div className="font-medium">
                        {invitation.invitedByFirstName} {invitation.invitedByLastName}
                      </div>
                      <div className="text-xs text-gray-500">{invitation.invitedByEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div>
                      <div className="text-sm">{invitation.expiresAt.toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeRemaining(invitation.expiresAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                        disabled={!!actionLoading[invitation.id]}
                        className="relative"
                      >
                        {actionLoading[invitation.id] === 'resend' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Resend
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                        disabled={!!actionLoading[invitation.id]}
                        className="relative text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {actionLoading[invitation.id] === 'cancel' ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <MailX className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {invitations.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          <p>• Invitations expire 7 days after being sent</p>
          <p>• Users will receive an email with a link to create their account</p>
          <p>
            • Cancelled invitations cannot be recovered - you'll need to create a new invitation
          </p>
        </div>
      )}
    </div>
  );
}
