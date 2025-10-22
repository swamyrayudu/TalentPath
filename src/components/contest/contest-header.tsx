import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Users, Lock, Globe, PlayCircle, CheckCircle, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';

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
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white animate-pulse px-3 py-1 gap-1.5 shadow-lg">
            <PlayCircle className="h-3.5 w-3.5" />
            Live
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Upcoming
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" className="px-3 py-1 gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-3 py-1 gap-1.5">
            <FileEdit className="h-3.5 w-3.5" />
            Draft
          </Badge>
        );
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="border-muted shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {contest.title}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {contest.description}
              </p>
            </div>
            
            {/* Visibility Badge */}
            <div className="flex items-start">
              {contest.visibility === 'private' ? (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Private</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Public</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-muted"></div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Time */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Start Time</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {format(new Date(contest.startTime), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(contest.startTime), 'hh:mm a')}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Duration</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDuration(contest.durationMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contest.durationMinutes} minutes
                </p>
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">End Time</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {format(new Date(contest.endTime), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(contest.endTime), 'hh:mm a')}
                </p>
              </div>
            </div>

            {/* Creator */}
            {contest.creatorName && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Created By</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {contest.creatorName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
