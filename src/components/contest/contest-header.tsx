import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Users, Trophy, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface ContestHeaderProps {
  contest: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    status: 'draft' | 'upcoming' | 'live' | 'ended';
    visibility: 'public' | 'private';
    creatorName?: string;
  };
}

export function ContestHeader({ contest }: ContestHeaderProps) {
  const getStatusBadge = () => {
    switch (contest.status) {
      case 'live':
        return <Badge className="bg-green-500 animate-pulse">🔴 Live</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">📅 Upcoming</Badge>;
      case 'ended':
        return <Badge variant="outline">✅ Ended</Badge>;
      default:
        return <Badge variant="outline">📝 Draft</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{contest.title}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">{contest.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {contest.visibility === 'private' ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Start Time</p>
              <p className="font-medium">{format(new Date(contest.startTime), 'MMM dd, yyyy')}</p>
              <p className="text-xs">{format(new Date(contest.startTime), 'hh:mm a')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Duration</p>
              <p className="font-medium">{contest.durationMinutes} minutes</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">End Time</p>
              <p className="font-medium">{format(new Date(contest.endTime), 'MMM dd, yyyy')}</p>
              <p className="text-xs">{format(new Date(contest.endTime), 'hh:mm a')}</p>
            </div>
          </div>

          {contest.creatorName && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Created By</p>
                <p className="font-medium">{contest.creatorName}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
