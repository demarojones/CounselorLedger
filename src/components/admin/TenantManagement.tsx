import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { validateTenantOperation } from '@/services/supabaseHelpers';
import type { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Building2, Mail, Phone, MapPin, User, Edit, AlertTriangle } from 'lucide-react';

export function TenantManagement() {
  const { user: currentUser } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate tenant operation
      const validation = await validateTenantOperation();
      if (!validation.isValid) {
        setError(validation.error || 'Unable to determine tenant context');
        return;
      }

      const { context } = validation;

      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', context!.tenantId)
        .single();

      if (fetchError) throw fetchError;

      // Transform DB response to Tenant type
      const transformedTenant: Tenant = {
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        contactPhone: data.contact_phone,
        contactAddress: data.contact_address,
        contactEmail: data.contact_email,
        contactPersonName: data.contact_person_name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setTenant(transformedTenant);
    } catch (err) {
      console.error('Error fetching tenant info:', err);
      setError('Failed to load tenant information');
    } finally {
      setIsLoading(false);
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
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading tenant information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No tenant information found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
          <p className="text-gray-600 mt-1">View and manage your organization's information</p>
        </div>
        <Button variant="outline" disabled>
          <Edit className="w-4 h-4 mr-2" />
          Edit Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Organization Name</label>
              <p className="text-gray-900 font-medium">{tenant.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Subdomain</label>
              <p className="text-gray-900 font-medium">{tenant.subdomain}</p>
              <p className="text-xs text-gray-500 mt-1">Used in your application URL</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">{tenant.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Contact Information</h3>
          </div>

          <div className="space-y-4">
            {tenant.contactPersonName ? (
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-gray-900 font-medium">{tenant.contactPersonName}</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-gray-500 italic">Not specified</p>
              </div>
            )}

            {tenant.contactEmail ? (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{tenant.contactEmail}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-500 italic">Not specified</p>
                </div>
              </div>
            )}

            {tenant.contactPhone ? (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{tenant.contactPhone}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-500 italic">Not specified</p>
                </div>
              </div>
            )}

            {tenant.contactAddress ? (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 whitespace-pre-line">{tenant.contactAddress}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-500 italic">Not specified</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Organization Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              This information was provided during initial system setup. Contact your system
              administrator if you need to update any of these details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
