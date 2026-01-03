import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import type { User } from '@/types/user';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SecurityEventManagement } from './SecurityEventManagement';

interface CounselorStats {
  counselorId: string;
  counselorName: string;
  totalInteractions: number;
  totalStudents: number;
  totalTimeSpent: number;
}

export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [counselors, setCounselors] = useState<User[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>('all');
  const [stats, setStats] = useState<CounselorStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'security'>('dashboard');

  useEffect(() => {
    fetchCounselors();
  }, []);

  useEffect(() => {
    if (counselors.length > 0) {
      fetchStats();
    }
  }, [counselors, selectedCounselorId]);

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'COUNSELOR')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;

      const transformedCounselors: User[] = (data || []).map(u => ({
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

      setCounselors(transformedCounselors);
    } catch (err) {
      console.error('Error fetching counselors:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      // Fetch all interactions
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('counselor_id, student_id, duration_minutes');

      if (error) throw error;

      // Calculate stats per counselor
      const counselorStatsMap = new Map<string, CounselorStats>();

      const targetCounselors =
        selectedCounselorId === 'all'
          ? counselors
          : counselors.filter(c => c.id === selectedCounselorId);

      targetCounselors.forEach(counselor => {
        const counselorInteractions = (interactions || []).filter(
          i => i.counselor_id === counselor.id
        );

        const uniqueStudents = new Set(
          counselorInteractions.map(i => i.student_id).filter(Boolean)
        );

        const totalTime = counselorInteractions.reduce(
          (sum, i) => sum + (i.duration_minutes || 0),
          0
        );

        counselorStatsMap.set(counselor.id, {
          counselorId: counselor.id,
          counselorName: `${counselor.firstName} ${counselor.lastName}`,
          totalInteractions: counselorInteractions.length,
          totalStudents: uniqueStudents.size,
          totalTimeSpent: totalTime,
        });
      });

      setStats(Array.from(counselorStatsMap.values()));
    } catch (err) {
      console.error('Error fetching stats:', err);
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

  const totalStats = stats.reduce(
    (acc, stat) => ({
      totalInteractions: acc.totalInteractions + stat.totalInteractions,
      totalStudents: acc.totalStudents + stat.totalStudents,
      totalTimeSpent: acc.totalTimeSpent + stat.totalTimeSpent,
    }),
    { totalInteractions: 0, totalStudents: 0, totalTimeSpent: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">System-wide analytics and counselor activity</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setActiveView('dashboard')}
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setActiveView('security')}
            variant={activeView === 'security' ? 'default' : 'outline'}
          >
            Security Events
          </Button>
        </div>
      </div>

      {activeView === 'security' ? (
        <SecurityEventManagement />
      ) : (
        <>
          {/* Counselor Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="max-w-xs">
              <Label htmlFor="counselor-filter">Filter by Counselor</Label>
              <Select
                id="counselor-filter"
                value={selectedCounselorId}
                onChange={e => setSelectedCounselorId(e.target.value)}
                className="mt-2"
              >
                <option value="all">All Counselors</option>
                {counselors.map(counselor => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.firstName} {counselor.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          {selectedCounselorId === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm font-medium text-gray-600">Total Interactions</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {totalStats.totalInteractions}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm font-medium text-gray-600">Total Students Served</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {totalStats.totalStudents}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm font-medium text-gray-600">Total Time (hours)</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {(totalStats.totalTimeSpent / 60).toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {/* Counselor Activity Comparison */}
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Loading statistics...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <>
              {/* Interactions Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Interactions by Counselor
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="counselorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalInteractions" fill="#3B82F6" name="Interactions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Students Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Students Served by Counselor
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="counselorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalStudents" fill="#10B981" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Time Spent Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Time Spent by Counselor (hours)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.map(s => ({
                      ...s,
                      totalTimeSpentHours: (s.totalTimeSpent / 60).toFixed(1),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="counselorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalTimeSpentHours" fill="#F59E0B" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Counselor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time (hours)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Time/Interaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.map(stat => (
                        <tr key={stat.counselorId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stat.counselorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {stat.totalInteractions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {stat.totalStudents}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(stat.totalTimeSpent / 60).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {stat.totalInteractions > 0
                              ? `${(stat.totalTimeSpent / stat.totalInteractions).toFixed(0)} min`
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
