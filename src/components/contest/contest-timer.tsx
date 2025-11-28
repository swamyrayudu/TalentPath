'use client';

import React from 'react';
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
  const [, setTimeLeft] = useState<string>('');
  const [timeUnits, setTimeUnits] = useState<{ value: string; unit: string }[]>([]);
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

        const units = [];
        if (days > 0) units.push({ value: days.toString().padStart(2, '0'), unit: 'Days' });
        if (hours > 0 || days > 0) units.push({ value: hours.toString().padStart(2, '0'), unit: 'Hours' });
        units.push({ value: minutes.toString().padStart(2, '0'), unit: 'Min' });
        units.push({ value: seconds.toString().padStart(2, '0'), unit: 'Sec' });
        
        setTimeUnits(units);
      } else if (now >= start && now <= end) {
        // Contest is live
        setIsLive(true);
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeUnits([
          { value: hours.toString().padStart(2, '0'), unit: 'Hours' },
          { value: minutes.toString().padStart(2, '0'), unit: 'Min' },
          { value: seconds.toString().padStart(2, '0'), unit: 'Sec' }
        ]);
      } else {
        // Contest ended
        setIsLive(false);
        setTimeLeft('Contest Ended');
        setTimeUnits([]);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime]);

  if (contest.status === 'ended') {
    return (
      <Card className="border bg-card">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-muted inline-block">
              <StopCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground">Contest Ended</p>
            <p className="text-sm text-muted-foreground">Check the leaderboard for results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card">
      <CardContent className="py-5 px-4 sm:px-6">
        {/* Header with Clock Icon and Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isLive ? 'Time Remaining' : 'Starts In'}
              </p>
            </div>
          </div>

          {isLive && (
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 text-xs animate-pulse">
              <PlayCircle className="h-3 w-3 mr-1.5" />
              Live Now
            </Badge>
          )}
        </div>

        {/* Timer Display */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {timeUnits.map((unit, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="border rounded-md bg-muted px-3 py-2 sm:px-4 sm:py-2.5 min-w-[56px] sm:min-w-[64px]">
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                    {unit.value}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-wide text-muted-foreground">
                  {unit.unit}
                </p>
              </div>
              
              {index < timeUnits.length - 1 && (
                <span className="text-xl sm:text-2xl font-bold text-muted-foreground hidden xs:block">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
