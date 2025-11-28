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
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse gap-1">
            <PlayCircle className="h-3 w-3" />
            Live
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
            <Clock className="h-3 w-3" />
            Upcoming
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <FileEdit className="h-3 w-3" />
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
    <Card className="border shadow-sm">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {contest.title}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {contest.description}
              </p>
            </div>
            
            {/* Visibility Badge */}
            <div className="flex items-start">
              {contest.visibility === 'private' ? (
                <Badge variant="secondary" className="gap-1.5">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs">Private</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs">Public</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t"></div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Start Time */}
            <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
              <div className="flex-shrink-0 p-1.5 sm:p-2 rounded bg-primary/10">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Start Time</p>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {format(new Date(contest.startTime), 'MMM dd, yyyy')}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {format(new Date(contest.startTime), 'hh:mm a')}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
              <div className="flex-shrink-0 p-1.5 sm:p-2 rounded bg-primary/10">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Duration</p>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {formatDuration(contest.durationMinutes)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {contest.durationMinutes} minutes
                </p>
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
              <div className="flex-shrink-0 p-1.5 sm:p-2 rounded bg-primary/10">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">End Time</p>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {format(new Date(contest.endTime), 'MMM dd, yyyy')}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {format(new Date(contest.endTime), 'hh:mm a')}
                </p>
              </div>
            </div>

            {/* Creator */}
            {contest.creatorName && (
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0 p-1.5 sm:p-2 rounded bg-primary/10">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Created By</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
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
