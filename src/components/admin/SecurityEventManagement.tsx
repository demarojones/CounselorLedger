/**
 * Security Event Management Component
 *
 * Admin interface for reviewing security events and monitoring
 * suspicious activity patterns.
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from '@/utils/toast';
import {
  getSecurityEvents,
  getSecurityEventStats,
  getSuspiciousActivity,
} from '@/services/securityEventService';
import type {
  SecurityEvent,
  SecurityEventFilters,
  SecurityEventStats,
  SuspiciousActivity,
  SecurityEventType,
  SecurityEventSeverity,
} from '@/types/security';

interface SecurityEventManagementProps {
  className?: string;
}

const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  INVITATION_CREATED: 'Invitation Created',
  INVITATION_ACCEPTED: 'Invitation Accepted',
  INVITATION_FAILED: 'Invitation Failed',
  INVITATION_EXPIRED: 'Invitation Expired',
  INVITATION_CANCELLED: 'Invitation Cancelled',
  INVITATION_RESENT: 'Invitation Resent',
  SETUP_TOKEN_USED: 'Setup Token Used',
  SETUP_TOKEN_FAILED: 'Setup Token Failed',
  RATE_LIMIT_EXCEEDED: 'Rate Limit Exceeded',
  SUSPICIOUS_ACTIVITY: 'Suspicious Activity',
  AUTH_FAILURE: 'Authentication Failure',
  TOKEN_MANIPULATION: 'Token Manipulation',
  DUPLICATE_EMAIL_ATTEMPT: 'Duplicate Email Attempt',
  INVALID_TOKEN_ACCESS: 'Invalid Token Access',
};

const SEVERITY_COLORS: Record<SecurityEventSeverity, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function SecurityEventManagement({ className }: SecurityEventManagementProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityEventStats | null>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SecurityEventFilters>({
    limit: 50,
    offset: 0,
  });
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'suspicious'>('events');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsResult, statsResult, suspiciousResult] = await Promise.all([
        getSecurityEvents(filters),
        getSecurityEventStats(30),
        getSuspiciousActivity(),
      ]);

      if (eventsResult.error) {
        toast.error('Failed to load security events: ' + eventsResult.error.message);
      } else {
        setEvents(eventsResult.data || []);
      }

      if (statsResult.error) {
        toast.error('Failed to load security stats: ' + statsResult.error.message);
      } else {
        setStats(statsResult.data);
      }

      if (suspiciousResult.error) {
        toast.error('Failed to load suspicious activity: ' + suspiciousResult.error.message);
      } else {
        setSuspiciousActivity(suspiciousResult.data || []);
      }
    } catch (error) {
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SecurityEventFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details) return 'No details';
    return JSON.stringify(details, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Security Event Management</h2>
        <p className="text-gray-600">Monitor security events and suspicious activity patterns</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'events', label: 'Security Events' },
            { key: 'stats', label: 'Statistics' },
            { key: 'suspicious', label: 'Suspicious Activity' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events (30 days)</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
              <div className="text-sm text-gray-600">Critical Events</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.highSeverityEvents}</div>
              <div className="text-sm text-gray-600">High Severity Events</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.uniqueIps}</div>
              <div className="text-sm text-gray-600">Unique IP Addresses</div>
            </Card>
          </div>

          {stats.recentEvents.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-3">
                {stats.recentEvents.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[event.severity]}`}
                      >
                        {event.severity}
                      </span>
                      <span className="text-sm text-gray-900">
                        {EVENT_TYPE_LABELS[event.eventType]}
                      </span>
                      {event.email && (
                        <span className="text-sm text-gray-500">({event.email})</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(event.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Suspicious Activity Tab */}
      {activeTab === 'suspicious' && (
        <div className="space-y-4">
          {suspiciousActivity.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-gray-500">
                No suspicious activity detected in the last 24 hours
              </div>
            </Card>
          ) : (
            suspiciousActivity.map((activity, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.riskLevel === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : activity.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {activity.riskLevel} RISK
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.eventCount} events from {activity.eventTypes} different types
                      </span>
                    </div>
                    {activity.email && (
                      <div className="text-sm text-gray-600">Email: {activity.email}</div>
                    )}
                    {activity.ipAddress && (
                      <div className="text-sm text-gray-600">IP: {activity.ipAddress}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      Event types:{' '}
                      {activity.eventTypeList.map(type => EVENT_TYPE_LABELS[type]).join(', ')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last event: {formatDate(activity.lastEvent)}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <Select
                  value={filters.eventType || ''}
                  onChange={e => handleFilterChange('eventType', e.target.value || undefined)}
                >
                  <option value="">All Types</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <Select
                  value={filters.severity || ''}
                  onChange={e => handleFilterChange('severity', e.target.value || undefined)}
                >
                  <option value="">All Severities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="Filter by email"
                  value={filters.email || ''}
                  onChange={e => handleFilterChange('email', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <Input
                  type="text"
                  placeholder="Filter by IP"
                  value={filters.ipAddress || ''}
                  onChange={e => handleFilterChange('ipAddress', e.target.value || undefined)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setFilters({ limit: 50, offset: 0 })} variant="outline">
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Events List */}
          <div className="space-y-4">
            {events.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-gray-500">No security events found</div>
              </Card>
            ) : (
              events.map(event => (
                <Card key={event.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[event.severity]}`}
                        >
                          {event.severity}
                        </span>
                        <span className="text-lg font-medium text-gray-900">
                          {EVENT_TYPE_LABELS[event.eventType]}
                        </span>
                      </div>
                      {event.email && (
                        <div className="text-sm text-gray-600">Email: {event.email}</div>
                      )}
                      {event.ipAddress && (
                        <div className="text-sm text-gray-600">IP Address: {event.ipAddress}</div>
                      )}
                      {event.userAgent && (
                        <div className="text-sm text-gray-600">User Agent: {event.userAgent}</div>
                      )}
                      {event.details && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Event Details
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                            {formatDetails(event.details)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(event.createdAt)}</div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {events.length === (filters.limit || 50) && (
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))
                }
                variant="outline"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SecurityEventManagement;
