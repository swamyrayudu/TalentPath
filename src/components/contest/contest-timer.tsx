'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, PlayCircle, StopCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContestTimerProps {
  contest: {
    startTime: Date;
    endTime: Date;
    status: 'draft' | 'upcoming' | 'live' | 'ended';
  };
}

export function ContestTimer({ contest }: ContestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();

      if (now < start) {
        // Contest hasn't started
        setIsLive(false);
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else if (now >= start && now <= end) {
        // Contest is live
        setIsLive(true);
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        // Contest ended
        setIsLive(false);
        setTimeLeft('Contest Ended');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime]);

  if (contest.status === 'ended') {
    return (
      <Card className="border-gray-300 dark:border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <StopCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-semibold">Contest Ended</p>
            <p className="text-sm text-muted-foreground">Check the leaderboard for results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isLive ? 'border-green-500 dark:border-green-600' : 'border-blue-500 dark:border-blue-600'}>
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`h-8 w-8 ${isLive ? 'text-green-500' : 'text-blue-500'}`} />
            <div>
              <p className="text-sm text-muted-foreground">
                {isLive ? 'Time Remaining' : 'Starts In'}
              </p>
              <p className="text-3xl font-bold font-mono">{timeLeft}</p>
            </div>
          </div>

          {isLive && (
            <Badge className="bg-green-500 animate-pulse text-white px-4 py-2">
              <PlayCircle className="h-4 w-4 mr-2" />
              Contest is Live!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
