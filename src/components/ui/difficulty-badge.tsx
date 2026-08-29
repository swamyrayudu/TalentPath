import * as React from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * One place for the easy/medium/hard palette. Every surface that shows a
 * difficulty reads from here so the three levels never drift apart between
 * the sheet, contests and company pages.
 */
const TONE = {
  easy: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  medium: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  hard: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
} as const;

const DOT = {
  easy: 'bg-emerald-500',
  medium: 'bg-amber-500',
  hard: 'bg-rose-500',
} as const;

type Level = keyof typeof TONE;

function normalize(difficulty: string): Level {
  const d = difficulty.toLowerCase();
  if (d.startsWith('e')) return 'easy';
  if (d.startsWith('h')) return 'hard';
  return 'medium';
}

export function difficultyDot(difficulty: string) {
  return DOT[normalize(difficulty)];
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  const level = normalize(difficulty);
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <Badge variant="outline" className={cn(TONE[level], className)}>
      {label}
    </Badge>
  );
}
