'use client';

import React from 'react';
import type { DailyCalendarDay } from '@/lib/daily-challenge';

/**
 * The month at a glance: one small cell per day, filled once the daily problem
 * is done. Days that haven't happened yet stay blank rather than reading as
 * misses. Sized to sit beside the problem rather than dominate it.
 */
export function StreakCalendar({
  days,
  monthLabel,
  completedThisMonth,
}: {
  days: DailyCalendarDay[];
  monthLabel: string;
  completedThisMonth: number;
}) {
  // Pad the grid so the 1st lands under its real weekday column.
  const firstWeekday = days.length
    ? new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay()
    : 0;

  return (
    <div className="w-fit">
      <div className="flex items-baseline justify-between gap-6">
        <span className="text-xs font-medium">{monthLabel}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {completedThisMonth}/{days.length}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
          <span
            key={i}
            className="pb-0.5 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/50"
          >
            {label}
          </span>
        ))}

        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`pad-${i}`} className="size-7" />
        ))}

        {days.map(day => (
          <div
            key={day.date}
            title={`${day.date}${day.completed ? ' · solved' : ''}`}
            className={`flex size-7 items-center justify-center rounded-md text-[11px] tabular-nums transition-colors ${
              day.completed
                ? 'bg-emerald-500/20 font-semibold text-emerald-600 dark:text-emerald-400'
                : day.isFuture
                  ? 'text-muted-foreground/25'
                  : 'bg-muted/50 text-muted-foreground/70'
            } ${day.isToday ? 'ring-1 ring-primary' : ''}`}
          >
            {day.dayOfMonth}
          </div>
        ))}
      </div>
    </div>
  );
}
