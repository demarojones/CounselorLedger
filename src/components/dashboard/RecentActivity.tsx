import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Interaction } from '@/types/interaction';

interface RecentActivityProps {
  interactions: Interaction[];
}

export function RecentActivity({ interactions }: RecentActivityProps) {
  // Format date and time
  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  // Get display name for interaction (student or contact)
  const getInteractionName = (interaction: Interaction): string => {
    if (interaction.student) {
      return `${interaction.student.firstName} ${interaction.student.lastName}`;
    }
    if (interaction.contact) {
      return `${interaction.contact.firstName} ${interaction.contact.lastName}`;
    }
    return 'Unknown';
  };

  // Get type label
  const getTypeLabel = (interaction: Interaction): string => {
    if (interaction.student) return 'Student';
    if (interaction.contact) return 'Contact';
    return '';
  };

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No recent interactions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/interactions">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.map((interaction) => (
            <div
              key={interaction.id}
              className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{getInteractionName(interaction)}</p>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {getTypeLabel(interaction)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {interaction.category?.name || 'Unknown Category'}
                  {interaction.subcategory && ` • ${interaction.subcategory.name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(interaction.startTime)} • {interaction.durationMinutes} min
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
