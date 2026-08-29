'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
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

function StatusBadge({ status }: { status: ContestCardProps['contest']['status'] }) {
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

function MetaRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{children}</span>
    </div>
  );
}

export function ContestCard({ contest }: ContestCardProps) {
  const cta =
    contest.status === 'live'
      ? 'Join now'
      : contest.status === 'ended'
        ? 'View results'
        : 'View contest';

  return (
    <Link
      href={`/contest/${contest.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {contest.title}
        </h3>
        <StatusBadge status={contest.status} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {contest.description}
      </p>

      <div className="mt-5 space-y-2 border-t pt-4">
        <MetaRow icon={Calendar}>
          {format(new Date(contest.startTime), 'MMM d, yyyy · h:mm a')}
        </MetaRow>
        <MetaRow icon={Clock}>{contest.durationMinutes} minutes</MetaRow>
        {contest.creatorName && <MetaRow icon={User}>by {contest.creatorName}</MetaRow>}
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
