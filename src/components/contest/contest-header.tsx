import { Badge } from '@/components/ui/badge';
import { Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';

interface ContestHeaderProps {
  contest: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    status: 'draft' | 'upcoming' | 'live' | 'ended';
    visibility: 'public' | 'private';
    creatorName?: string;
  };
}

function StatusBadge({ status }: { status: ContestHeaderProps['contest']['status'] }) {
  if (status === 'live') {
    return (
      <Badge className="gap-1.5">
        <span className="size-1.5 rounded-full bg-current" />
        Live
      </Badge>
    );
  }
  if (status === 'upcoming') return <Badge variant="secondary">Upcoming</Badge>;
  if (status === 'ended') return <Badge variant="outline">Ended</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-b py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:py-0 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function ContestHeader({ contest }: ContestHeaderProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {contest.title}
        </h1>
        <StatusBadge status={contest.status} />
        {contest.visibility === 'private' ? (
          <Badge variant="outline" className="gap-1.5">
            <Lock className="size-3" />
            Private
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5">
            <Globe className="size-3" />
            Public
          </Badge>
        )}
      </div>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {contest.description}
      </p>

      <div className="mt-6 rounded-2xl border bg-card px-5 py-4 sm:flex sm:items-center sm:py-5">
        <Fact
          label="Starts"
          value={format(new Date(contest.startTime), 'MMM d, yyyy')}
          sub={format(new Date(contest.startTime), 'h:mm a')}
        />
        <Fact
          label="Ends"
          value={format(new Date(contest.endTime), 'MMM d, yyyy')}
          sub={format(new Date(contest.endTime), 'h:mm a')}
        />
        <Fact
          label="Duration"
          value={formatDuration(contest.durationMinutes)}
          sub={`${contest.durationMinutes} minutes`}
        />
        {contest.creatorName && <Fact label="Created by" value={contest.creatorName} />}
      </div>
    </div>
  );
}
