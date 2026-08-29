'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { ProblemRow } from '@/components/dsa/problem-row';
import { useSheetProgress } from '@/components/dsa/use-sheet-progress';
import { ExternalLink, FileText, ListChecks, Play, Search, Target, X } from 'lucide-react';
import type { SheetDifficulty, SheetProblem, SheetSubStep } from '@/lib/sheets';

type Filter = 'all' | SheetDifficulty;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

/** The article/video links the sheet carries, shown inline next to a problem. */
function Resources({ problem }: { problem: SheetProblem }) {
  if (!problem.articleUrl && !problem.videoUrl && !problem.altUrl) return null;

  return (
    <span className="hidden shrink-0 items-center gap-1 sm:flex">
      {problem.articleUrl && (
        <a
          href={problem.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Article for ${problem.title}`}
          title="Article"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <FileText className="size-3.5" strokeWidth={1.75} />
        </a>
      )}
      {problem.videoUrl && (
        <a
          href={problem.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Video for ${problem.title}`}
          title="Video"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Play className="size-3.5" strokeWidth={1.75} />
        </a>
      )}
      {problem.altUrl && (
        <a
          href={problem.altUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Alternate link for ${problem.title}`}
          title="Alternate practice link"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3.5" strokeWidth={1.75} />
        </a>
      )}
    </span>
  );
}

export function SheetProblemList({
  sheetSlug,
  title,
  description,
  subSteps,
}: {
  sheetSlug: string;
  title: string;
  description: string;
  subSteps: SheetSubStep[];
}) {
  const { progress, toggleSolved } = useSheetProgress();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const keyFor = (problem: SheetProblem) => `${sheetSlug}:${problem.id}`;

  const all = useMemo(() => subSteps.flatMap((s) => s.problems), [subSteps]);

  // The 450 sheet (and any other ungraded source) has no difficulty to show.
  const graded = useMemo(() => all.some((p) => !!p.difficulty), [all]);

  const counts = useMemo(() => {
    const solvedIn = (list: SheetProblem[]) =>
      list.filter((p) => progress[keyFor(p)] === 'solved').length;

    const byLevel = (level: SheetDifficulty) => {
      const list = all.filter((p) => p.difficulty === level);
      return { solved: solvedIn(list), total: list.length };
    };

    return {
      solved: solvedIn(all),
      total: all.length,
      easy: byLevel('easy'),
      medium: byLevel('medium'),
      hard: byLevel('hard'),
    };
  }, [all, progress, sheetSlug]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return subSteps
      .map((sub) => ({
        title: sub.title,
        problems: sub.problems.filter(
          (p) =>
            (filter === 'all' || p.difficulty === filter) &&
            (!q || p.title.toLowerCase().includes(q))
        ),
      }))
      .filter((sub) => sub.problems.length > 0);
  }, [subSteps, filter, query]);

  const showSubHeadings = subSteps.length > 1;
  const matches = visible.reduce((n, sub) => n + sub.problems.length, 0);

  return (
    <>
      <SheetProgressHeader
        icon={ListChecks}
        title={title}
        description={description}
        solved={counts.solved}
        total={counts.total}
        splits={
          graded
            ? [
                { label: 'Easy', ...counts.easy },
                { label: 'Medium', ...counts.medium },
                { label: 'Hard', ...counts.hard },
              ]
            : undefined
        }
      />

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {graded && (
        <div className="inline-flex shrink-0 rounded-full border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                filter === f.key
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        )}

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Problems ───────────────────────────────────────────── */}
      {matches === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <Target className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-semibold tracking-tight">No matching problems</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or difficulty.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {visible.map((sub) => (
            <section key={sub.title}>
              {showSubHeadings && (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold tracking-tight">{sub.title}</h2>
                  <Badge variant="outline" className="tabular-nums">
                    {sub.problems.length}
                  </Badge>
                </div>
              )}

              <div className={showSubHeadings ? 'mt-3 space-y-2' : 'space-y-2'}>
                {sub.problems.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    title={problem.title}
                    url={problem.url ?? problem.articleUrl ?? ''}
                    difficulty={problem.difficulty}
                    status={progress[keyFor(problem)]}
                    onToggle={() => toggleSolved(keyFor(problem))}
                    trailing={<Resources problem={problem} />}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Progress is saved in this browser.{' '}
        <span className="text-muted-foreground/70">
          Sign-in sync is not wired up for curated sheets yet.
        </span>
      </p>
    </>
  );
}
