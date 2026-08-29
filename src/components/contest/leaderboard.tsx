import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import React from 'react';

interface LeaderboardProps {
  leaderboard: Array<{
    rank: number | null;
    userId: string;
    userName: string | null;
    userImage: string | null;
    totalScore: number;
    problemsSolved: number;
    totalTimeMinutes: number;
  }>;
  compact?: boolean;
}

const formatTime = (minutes: number) => {
  if (minutes < 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/** Top three read as ranked without medal icons — the number carries it. */
function Rank({ rank }: { rank: number | null }) {
  if (!rank) return <span className="w-6" />;

  return (
    <span
      className={`w-6 shrink-0 text-center text-sm font-semibold tabular-nums ${
        rank <= 3 ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {rank}
    </span>
  );
}

export function ContestLeaderboard({ leaderboard, compact = false }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
        <Trophy className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        <h3 className="mt-4 text-sm font-semibold tracking-tight">No submissions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Be the first on the board.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight">Top participants</h2>
        </div>
        <div className="divide-y">
          {leaderboard.slice(0, 5).map((entry) => (
            <div key={entry.userId} className="flex items-center gap-3 px-5 py-3">
              <Rank rank={entry.rank} />
              <Avatar className="size-7 border">
                <AvatarImage src={entry.userImage || undefined} />
                <AvatarFallback className="text-xs">
                  {entry.userName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.userName || 'Anonymous'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {entry.totalScore} pts · {entry.problemsSolved} solved
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Leaderboard</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {leaderboard.length} participant{leaderboard.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="divide-y">
        {leaderboard.map((entry) => (
          <div key={entry.userId} className="flex items-center gap-3 px-5 py-3.5">
            <Rank rank={entry.rank} />

            <Avatar className="size-9 border">
              <AvatarImage src={entry.userImage || undefined} />
              <AvatarFallback className="text-sm">
                {entry.userName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {entry.userName || 'Anonymous'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {entry.problemsSolved} solved · {formatTime(entry.totalTimeMinutes)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">{entry.totalScore}</p>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
