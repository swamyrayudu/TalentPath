'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Contest {
  id: string;
  title: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  status: 'draft' | 'upcoming' | 'live' | 'ended';
  participantCount?: number;
}

interface ContestsCardProps {
  contests: Contest[];
}

export default function ContestsCard({ contests }: ContestsCardProps) {
  const liveContests = contests.filter(c => c.status === 'live');
  const upcomingContests = contests.filter(c => c.status === 'upcoming').slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse">Live</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="border-primary text-primary">Upcoming</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contests</CardTitle>
            <CardDescription>Compete and improve your skills</CardDescription>
          </div>
          <Trophy className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveContests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              Live Now
            </h4>
            {liveContests.map((contest) => (
              <Link 
                key={contest.id}
                href={`/contest/${contest.slug}`}
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium line-clamp-1">{contest.title}</h5>
                  {getStatusBadge(contest.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ends {formatDistanceToNow(new Date(contest.endTime), { addSuffix: true })}
                  </div>
                  {contest.participantCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {contest.participantCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {upcomingContests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Upcoming</h4>
            {upcomingContests.map((contest) => (
              <Link 
                key={contest.id}
                href={`/contest/${contest.slug}`}
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium line-clamp-1">{contest.title}</h5>
                  {getStatusBadge(contest.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Starts {formatDistanceToNow(new Date(contest.startTime), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {liveContests.length === 0 && upcomingContests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active contests right now</p>
          </div>
        )}

        <Link 
          href="/contest" 
          className="block w-full text-center py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
        >
          View All Contests
        </Link>
      </CardContent>
    </Card>
  );
}
