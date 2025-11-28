'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowRight, Trophy, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface ContestCardProps {
  contest: {
    id: string;
    title: string;
    description: string;
    slug: string;
    startTime: Date;
    durationMinutes: number;
    status: 'draft' | 'upcoming' | 'live' | 'ended';
    visibility: 'public' | 'private';
    creatorName?: string | null;
  };
}

export function ContestCard({ contest }: ContestCardProps) {
  const getStatusBadge = () => {
    switch (contest.status) {
      case 'live':
        return (
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Live Now
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
            Upcoming
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" className="border-0">
            Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
            Draft
          </Badge>
        );
    }
  };

  const getCardStyle = () => {
    switch (contest.status) {
      case 'live':
        return 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:shadow-lg';
      case 'upcoming':
        return 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:shadow-lg';
      case 'ended':
        return 'border-border/50 hover:border-border hover:shadow-md';
      default:
        return 'border-amber-500/30 hover:border-amber-500 hover:shadow-md';
    }
  };

  return (
    <Card className={`transition-all duration-300 group relative overflow-hidden cursor-pointer ${getCardStyle()}`}>
      <CardHeader className="relative pb-2 sm:pb-3 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          {getStatusBadge()}
        </div>
        <CardTitle className="text-lg sm:text-xl leading-tight">
          {contest.title}
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
          {contest.description}
        </p>
      </CardHeader>
      
      <CardContent className="relative p-4 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-7">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="p-1 sm:p-1.5 rounded bg-muted flex-shrink-0">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <span className="truncate">{format(new Date(contest.startTime), 'MMM dd, yyyy • hh:mm a')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="p-1 sm:p-1.5 rounded bg-muted flex-shrink-0">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <span>{contest.durationMinutes} minutes</span>
          </div>

          {contest.creatorName && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="p-1 sm:p-1.5 rounded bg-muted flex-shrink-0">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="truncate">by {contest.creatorName}</span>
            </div>
          )}
        </div>

        <Link href={`/contest/${contest.slug}`}>
          <Button 
            className="w-full cursor-pointer transition-all duration-200 text-sm sm:text-base h-9 sm:h-10" 
            variant={contest.status === 'ended' ? 'outline' : 'default'}
          >
            {contest.status === 'live' ? 'Join Now' : contest.status === 'ended' ? 'View Results' : 'View Contest'}
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
