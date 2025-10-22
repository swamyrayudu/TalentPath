'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowRight, Trophy } from 'lucide-react';
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
          <Badge className="bg-green-500 hover:bg-green-600 text-white animate-pulse border-0">
            🔴 Live Now
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
            📅 Upcoming
          </Badge>
        );
      case 'ended':
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
            ✅ Ended
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
            📝 Draft
          </Badge>
        );
    }
  };

  const getCardBorderClass = () => {
    switch (contest.status) {
      case 'live':
        return 'border-green-500 border-2';
      case 'upcoming':
        return 'border-blue-500 border-2';
      case 'ended':
        return 'border-gray-300';
      default:
        return 'border-amber-500';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${getCardBorderClass()}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          {getStatusBadge()}
        </div>
        <CardTitle className="text-xl">{contest.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{contest.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(contest.startTime), 'MMM dd, yyyy • hh:mm a')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{contest.durationMinutes} minutes</span>
          </div>

          {contest.creatorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>by {contest.creatorName}</span>
            </div>
          )}
        </div>

        <Link href={`/contest/${contest.slug}`}>
          <Button className="w-full" variant={contest.status === 'ended' ? 'outline' : 'default'}>
            {contest.status === 'live' ? 'Join Now' : contest.status === 'ended' ? 'View Results' : 'View Contest'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
