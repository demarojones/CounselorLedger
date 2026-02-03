import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Clock } from 'lucide-react';
import { PrivacyIndicator } from '@/components/common/PrivacyIndicator';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStatsProps {
  totalInteractions: number;
  totalStudents: number;
  totalTimeSpent: number;
}

export function DashboardStats({
  totalInteractions,
  totalStudents,
  totalTimeSpent,
}: DashboardStatsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Format time spent (convert minutes to hours and minutes)
  const formatTimeSpent = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const stats = [
    {
      title: 'Total Interactions',
      value: totalInteractions,
      description: isAdmin ? 'All counselor sessions' : 'Your counseling sessions',
      icon: MessageSquare,
      color: 'from-primary-400 to-primary-600',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Students Seen',
      value: totalStudents,
      description: isAdmin ? 'Students helped by all counselors' : 'Students you have helped',
      icon: Users,
      color: 'from-primary-500 to-primary-700',
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-700',
    },
    {
      title: 'Time Spent',
      value: formatTimeSpent(totalTimeSpent),
      description: isAdmin ? 'Total counseling time (all)' : 'Your counseling time',
      icon: Clock,
      color: 'from-secondary-400 to-secondary-600',
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Privacy Context Header */}
      <PrivacyIndicator type="statistics" />

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                  {!isAdmin && <PrivacyIndicator type="statistics" variant="inline" />}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
              <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
