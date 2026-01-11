import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { logAdminAggregatedAccess } from '@/services/auditService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportHelpers';

interface InteractionData {
  id: string;
  counselor_id: string;
  student_id: string;
  category_id: string;
  duration_minutes: number;
  start_time: string;
  created_at: string;
}

interface CounselorData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
}

export function AdminReports() {
  const { user: currentUser } = useAuth();
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [counselors, setCounselors] = useState<CounselorData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch all interactions (admin can see all in tenant due to RLS)
      const { data: interactionsData, error: interactionsError } = await supabase.from(
        'interactions'
      ).select(`
          id,
          counselor_id,
          student_id,
          category_id,
          duration_minutes,
          start_time,
          created_at
        `);

      if (interactionsError) throw interactionsError;

      // Fetch counselors
      const { data: counselorsData, error: counselorsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('role', 'COUNSELOR')
        .eq('is_active', true);

      if (counselorsError) throw counselorsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('reason_categories')
        .select('id, name, color');

      if (categoriesError) throw categoriesError;

      setInteractions(interactionsData || []);
      setCounselors(counselorsData || []);
      setCategories(categoriesData || []);

      // Log admin aggregated access for audit trail
      await logAdminAggregatedAccess('reports', (interactionsData || []).length, {
        dateRange,
        counselorCount: (counselorsData || []).length,
        categoryCount: (categoriesData || []).length,
      });
    } catch (err) {
      console.error('Error fetching admin reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInteractions = useMemo(() => {
    if (dateRange === 'all') return interactions;

    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    return interactions.filter(interaction => new Date(interaction.start_time) >= cutoffDate);
  }, [interactions, dateRange]);

  const reportData = useMemo(() => {
    // Overall statistics
    const totalInteractions = filteredInteractions.length;
    const uniqueStudents = new Set(filteredInteractions.map(i => i.student_id)).size;
    const totalTime = filteredInteractions.reduce((sum, i) => sum + i.duration_minutes, 0);
    const activeCounselors = new Set(filteredInteractions.map(i => i.counselor_id)).size;

    // Counselor performance data
    const counselorStats = counselors
      .map(counselor => {
        const counselorInteractions = filteredInteractions.filter(
          i => i.counselor_id === counselor.id
        );
        const uniqueStudentsForCounselor = new Set(counselorInteractions.map(i => i.student_id))
          .size;
        const totalTimeForCounselor = counselorInteractions.reduce(
          (sum, i) => sum + i.duration_minutes,
          0
        );

        return {
          counselorName: `${counselor.first_name} ${counselor.last_name}`,
          totalInteractions: counselorInteractions.length,
          uniqueStudents: uniqueStudentsForCounselor,
          totalTime: totalTimeForCounselor,
          avgTimePerInteraction:
            counselorInteractions.length > 0
              ? Math.round(totalTimeForCounselor / counselorInteractions.length)
              : 0,
        };
      })
      .filter(stat => stat.totalInteractions > 0);

    // Category breakdown
    const categoryStats = categories
      .map(category => {
        const categoryInteractions = filteredInteractions.filter(
          i => i.category_id === category.id
        );
        return {
          name: category.name,
          count: categoryInteractions.length,
          percentage:
            totalInteractions > 0
              ? Math.round((categoryInteractions.length / totalInteractions) * 100)
              : 0,
          color: category.color || '#8884d8',
        };
      })
      .filter(stat => stat.count > 0);

    // Weekly trend data
    const weeklyTrend = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekInteractions = filteredInteractions.filter(interaction => {
        const interactionDate = new Date(interaction.start_time);
        return interactionDate >= weekStart && interactionDate <= weekEnd;
      });

      weeklyTrend.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        interactions: weekInteractions.length,
        uniqueStudents: new Set(weekInteractions.map(i => i.student_id)).size,
      });
    }

    return {
      totalInteractions,
      uniqueStudents,
      totalTime,
      activeCounselors,
      counselorStats,
      categoryStats,
      weeklyTrend,
    };
  }, [filteredInteractions, counselors, categories]);

  const handleExportCSV = () => {
    const csvData = [
      { metric: 'Total Interactions', value: reportData.totalInteractions },
      { metric: 'Unique Students', value: reportData.uniqueStudents },
      { metric: 'Total Time (hours)', value: Math.round((reportData.totalTime / 60) * 10) / 10 },
      { metric: 'Active Counselors', value: reportData.activeCounselors },
      ...reportData.counselorStats.map(stat => ({
        metric: `${stat.counselorName} - Interactions`,
        value: stat.totalInteractions,
      })),
    ];
    exportToCSV(csvData, 'admin-report', ['metric', 'value']);
  };

  const handleExportPDF = () => {
    exportToPDF('admin-reports-content', 'admin-report');
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
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-reports-content" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive analytics across all counselors</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-range">Time Period:</Label>
            <Select
              id="date-range"
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{reportData.totalInteractions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{reportData.uniqueStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((reportData.totalTime / 60) * 10) / 10}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Counselors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{reportData.activeCounselors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Counselor Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Counselor Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.counselorStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.counselorStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="counselorName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalInteractions" fill="#3B82F6" name="Interactions" />
                <Bar dataKey="uniqueStudents" fill="#10B981" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interaction Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name} (${Math.round((value / reportData.totalInteractions) * 100)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="interactions"
                    stroke="#3B82F6"
                    name="Interactions"
                  />
                  <Line type="monotone" dataKey="uniqueStudents" stroke="#10B981" name="Students" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No trend data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Counselor Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Counselor Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.counselorStats.length > 0 ? (
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
                      Total Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time/Session
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.counselorStats.map((stat, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.counselorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stat.totalInteractions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stat.uniqueStudents}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {Math.round((stat.totalTime / 60) * 10) / 10}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stat.avgTimePerInteraction}min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No counselor data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
