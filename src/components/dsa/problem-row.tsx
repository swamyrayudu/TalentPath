'use client';

import React from 'react';
import { Check, Link2, Loader2, Lock } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';

export type ProblemStatus = 'solved' | 'attempted' | 'bookmarked' | undefined;

/**
 * One line of a problem list: mark it, open it, see how hard it is. Everything
 * else (likes, acceptance, company tags) is deliberately left off so a sheet of
 * a hundred rows still scans in one pass.
 */
export function ProblemRow({
  title,
  url,
  difficulty,
  status,
  isUpdating = false,
  isLocked = false,
  onToggle,
  onLockedClick,
  trailing,
}: {
  title: string;
  url: string;
  /** Omitted by sheets whose source does not grade problems. */
  difficulty?: string;
  status: ProblemStatus;
  isUpdating?: boolean;
  isLocked?: boolean;
  onToggle: () => void;
  onLockedClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const isSolved = status === 'solved';
  const isAttempted = status === 'attempted';

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={isLocked ? onLockedClick : onToggle}
        disabled={isUpdating}
        aria-label={
          isLocked
            ? 'Sign in to track progress'
            : isSolved
              ? `Mark ${title} unsolved`
              : `Mark ${title} solved`
        }
        title={isLocked ? 'Sign in to track progress' : undefined}
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          isSolved
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : isAttempted
              ? 'border-amber-500 text-amber-500'
              : 'border-muted-foreground/30 text-transparent hover:border-muted-foreground/60'
        }`}
      >
        {isUpdating ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : isLocked ? (
          <Lock className="size-2.5 text-muted-foreground/60" strokeWidth={2.5} />
        ) : isSolved ? (
          <Check className="size-3" strokeWidth={3} />
        ) : isAttempted ? (
          <span className="size-1.5 rounded-full bg-current" />
        ) : null}
      </button>

      {/* A few sheet entries are theory with no problem to open. */}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <Link2
            className="size-4 shrink-0 text-muted-foreground/60"
            strokeWidth={1.75}
          />
          <span
            className={`truncate text-sm transition-colors hover:text-primary ${
              isSolved ? 'text-muted-foreground' : 'font-medium'
            }`}
          >
            {title}
          </span>
        </a>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <Link2 className="size-4 shrink-0 text-muted-foreground/25" strokeWidth={1.75} />
          <span
            className={`truncate text-sm ${
              isSolved ? 'text-muted-foreground' : 'font-medium'
            }`}
          >
            {title}
          </span>
        </span>
      )}

      {trailing}

      {difficulty && <DifficultyBadge difficulty={difficulty} className="shrink-0" />}
    </div>
  );
}
