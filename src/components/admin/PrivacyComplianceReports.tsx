import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  generatePrivacyComplianceReport,
  type PrivacyComplianceReport,
} from '@/services/auditService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/utils/toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PrivacyComplianceReports() {
  const { user: currentUser } = useAuth();
  const [report, setReport] = useState<PrivacyComplianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generatePrivacyComplianceReport(new Date(startDate), new Date(endDate));

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setReport(result.data);
      toast.success('Privacy compliance report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate privacy compliance report');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate report on component mount
  useEffect(() => {
    generateReport();
  }, []);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const eventTypeData = report
    ? Object.entries(report.eventsByType).map(([type, count]) => ({
        name: type.replace(/_/g, ' '),
        count,
      }))
    : [];

  const severityData = report
    ? Object.entries(report.eventsBySeverity).map(([severity, count]) => ({
        name: severity,
        count,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy Compliance Reports</h2>
          <p className="text-gray-600 mt-1">Monitor privacy controls and audit trail compliance</p>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Compliance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Access Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{report.totalAccessEvents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Authorized Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{report.authorizedAccess}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Privacy Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {report.privacyViolationAttempts}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Compliance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    report.complianceScore >= 95
                      ? 'text-green-600'
                      : report.complianceScore >= 85
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {report.complianceScore}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Period and Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Report Period</h4>
                  <p className="text-gray-600">
                    {report.reportPeriod.startDate.toLocaleDateString()} -{' '}
                    {report.reportPeriod.endDate.toLocaleDateString()}
                  </p>

                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">Activity Overview</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• {report.uniqueUsers} unique users accessed the system</li>
                    <li>• {report.deniedAccess} access attempts were denied</li>
                    <li>• Most accessed resource type: {report.mostAccessedResourceType}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Compliance Status</h4>
                  <div
                    className={`p-3 rounded-lg ${
                      report.complianceScore >= 95
                        ? 'bg-green-50 text-green-800'
                        : report.complianceScore >= 85
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {report.complianceScore >= 95
                      ? 'Excellent compliance - privacy controls are working effectively'
                      : report.complianceScore >= 85
                        ? 'Good compliance - minor privacy violations detected'
                        : 'Poor compliance - significant privacy violations require attention'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types */}
            <Card>
              <CardHeader>
                <CardTitle>Access Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                {eventTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">No event data available</p>
                )}
              </CardContent>
            </Card>

            {/* Event Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Event Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {severityData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">No severity data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Users Table */}
          {report.topUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Access Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Violation Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.topUsers.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.userId.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.accessCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.violationCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.violationCount === 0
                                  ? 'bg-green-100 text-green-800'
                                  : user.violationCount <= 2
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.violationCount === 0
                                ? 'Low'
                                : user.violationCount <= 2
                                  ? 'Medium'
                                  : 'High'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
