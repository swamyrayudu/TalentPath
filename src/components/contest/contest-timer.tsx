'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface ContestTimerProps {
  contest: {
    startTime: Date;
    endTime: Date;
    status: 'draft' | 'upcoming' | 'live' | 'ended';
  };
}

export function ContestTimer({ contest }: ContestTimerProps) {
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
        if (hours > 0 || days > 0) units.push({ value: hours.toString().padStart(2, '0'), unit: 'Hrs' });
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
          { value: hours.toString().padStart(2, '0'), unit: 'Hrs' },
          { value: minutes.toString().padStart(2, '0'), unit: 'Min' },
          { value: seconds.toString().padStart(2, '0'), unit: 'Sec' },
        ]);
      } else {
        // Contest ended
        setIsLive(false);
        setTimeUnits([]);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime]);

  if (contest.status === 'ended') {
    return (
      <div className="rounded-2xl border bg-card px-5 py-4">
        <p className="text-sm font-medium">Contest ended</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check the leaderboard for final standings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4">
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        )}
        <p className="text-sm font-medium">
          {isLive ? 'Time remaining' : 'Starts in'}
        </p>
      </div>

      <div className="flex items-end gap-4">
        {timeUnits.map((unit) => (
          <div key={unit.unit} className="text-center">
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
              {unit.value}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {unit.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
