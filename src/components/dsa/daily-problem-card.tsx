'use client';

import React from 'react';
import { toast } from 'sonner';
import { ArrowUpRight, CalendarCheck, Check, Flame, Loader2 } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { StreakCalendar } from '@/components/dsa/streak-calendar';
import { toggleDailyCompletion } from '@/actions/daily-challenge.actions';
import type { DailyProblem, DailyStreak } from '@/lib/daily-challenge';

function StreakFigure({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Today's problem and the streak it feeds. The streak updates optimistically on
 * toggle so the calendar reacts immediately, then settles on the server's answer.
 */
export function DailyProblemCard({
  problem,
  streak: initialStreak,
  isSignedIn,
}: {
  problem: DailyProblem | null;
  streak: DailyStreak;
  isSignedIn: boolean;
}) {
  const [streak, setStreak] = React.useState(initialStreak);
  const [isPending, startTransition] = React.useTransition();

  // A server revalidation can hand down fresh props; trust them over local state.
  React.useEffect(() => setStreak(initialStreak), [initialStreak]);

  const today = streak.calendar.find(d => d.isToday);

  function handleToggle() {
    const nextSolved = !streak.solvedToday;

    setStreak(prev => ({
      ...prev,
      solvedToday: nextSolved,
      current: nextSolved ? prev.current + 1 : Math.max(0, prev.current - 1),
      totalCompleted: nextSolved
        ? prev.totalCompleted + 1
        : Math.max(0, prev.totalCompleted - 1),
      completedThisMonth: nextSolved
        ? prev.completedThisMonth + 1
        : Math.max(0, prev.completedThisMonth - 1),
      calendar: prev.calendar.map(d => (d.isToday ? { ...d, completed: nextSolved } : d)),
    }));

    startTransition(async () => {
      const result = await toggleDailyCompletion();

      if (!result.success) {
        setStreak(initialStreak);
        toast.error(result.error ?? 'Could not update the daily problem.');
        return;
      }

      setStreak(prev => ({
        ...prev,
        solvedToday: result.solvedToday ?? prev.solvedToday,
        current: result.streak ?? prev.current,
        longest: result.longest ?? prev.longest,
        completedThisMonth: result.completedThisMonth ?? prev.completedThisMonth,
        calendar: prev.calendar.map(d =>
          d.isToday ? { ...d, completed: result.solvedToday ?? d.completed } : d
        ),
      }));

      if (result.solvedToday) {
        toast.success(
          result.streak && result.streak > 1
            ? `Day ${result.streak} of your streak. Nice.`
            : 'Daily problem marked solved.'
        );
      }
    });
  }

  if (!problem) return null;

  return (
    <section id="daily-problem" className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-3.5 text-primary" strokeWidth={2} />
          <h2 className="text-xs font-semibold">Problem of the day</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {today
            ? new Date(`${today.date}T00:00:00.000Z`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            : 'Today'}
        </span>
      </div>

      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:justify-between">
        {/* Problem */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.platform && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {problem.platform}
              </span>
            )}
            {problem.acceptanceRate !== null && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {problem.acceptanceRate.toFixed(0)}% acceptance
              </span>
            )}
          </div>

          <h3 className="mt-2.5 text-lg font-semibold tracking-tight">{problem.title}</h3>

          {problem.topics.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {problem.topics.join(' · ')}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {problem.url && (
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                Solve it
                <ArrowUpRight className="size-3.5" strokeWidth={2} />
              </a>
            )}

            {isSignedIn ? (
              <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  streak.solvedToday
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'hover:border-primary/40 hover:bg-muted/40'
                }`}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" strokeWidth={2.5} />
                )}
                {streak.solvedToday ? 'Solved today' : 'Mark solved'}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Sign in to track your streak.
              </span>
            )}
          </div>
        </div>

        {/* Streak */}
        {isSignedIn && (
          <div className="shrink-0 sm:border-l sm:pl-6">
            <StreakCalendar
              days={streak.calendar}
              monthLabel={streak.monthLabel}
              completedThisMonth={streak.completedThisMonth}
            />

            <div className="mt-4 flex items-start gap-5 border-t pt-3">
              <div className="flex items-center gap-1.5">
                <Flame
                  className={`size-3.5 ${
                    streak.current > 0 ? 'text-primary' : 'text-muted-foreground/40'
                  }`}
                  strokeWidth={2}
                />
                <StreakFigure label="Streak" value={`${streak.current}d`} />
              </div>
              <StreakFigure label="Longest" value={`${streak.longest}d`} />
              <StreakFigure label="Total" value={streak.totalCompleted} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
