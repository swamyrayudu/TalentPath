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
      <Card className="border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-400 dark:bg-gray-600 rounded-full blur-xl opacity-20"></div>
              <StopCircle className="h-16 w-16 text-gray-500 dark:text-gray-400 mx-auto relative" />
            </div>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">Contest Ended</p>
            <p className="text-sm text-muted-foreground">Check the leaderboard for results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        ${isLive 
          ? 'border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' 
          : 'border-blue-500 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30'
        } 
        shadow-lg
      `}
    >
      <CardContent className="py-6 px-4 sm:px-6">
        {/* Header with Clock Icon and Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`absolute inset-0 ${isLive ? 'bg-green-500' : 'bg-blue-500'} rounded-full blur-lg opacity-30 animate-pulse`}></div>
              <Clock className={`h-10 w-10 ${isLive ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} relative`} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {isLive ? 'Time Remaining' : 'Starts In'}
              </p>
            </div>
          </div>

          {isLive && (
            <Badge className="bg-green-500 hover:bg-green-600 animate-pulse text-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm shadow-lg">
              <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Contest is Live!
            </Badge>
          )}
        </div>

        {/* Timer Display */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {timeUnits.map((unit, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    ${isLive 
                      ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700' 
                      : 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700'
                    }
                    border-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-md
                    min-w-[60px] sm:min-w-[70px]
                  `}
                >
                  <p className={`
                    text-2xl sm:text-3xl md:text-4xl font-bold font-mono
                    ${isLive ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}
                  `}>
                    {unit.value}
                  </p>
                </div>
                <p className={`
                  text-[10px] sm:text-xs font-medium mt-1.5 uppercase tracking-wide
                  ${isLive ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}
                `}>
                  {unit.unit}
                </p>
              </div>
              
              {index < timeUnits.length - 1 && (
                <span className={`
                  text-xl sm:text-2xl md:text-3xl font-bold
                  ${isLive ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}
                  hidden xs:block
                `}>
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
