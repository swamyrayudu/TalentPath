'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';

import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { useSheetProgress } from '@/components/dsa/use-sheet-progress';

export interface StepSummary {
  slug: string;
  title: string;
  /** Every problem id in the step. */
  ids: string[];
  /** Split by level — omitted for sheets whose source does not grade problems. */
  byLevel?: { easy: string[]; medium: string[]; hard: string[] };
}

export function SheetStepGrid({
  sheetSlug,
  sheetName,
  description,
  steps,
}: {
  sheetSlug: string;
  sheetName: string;
  description: string;
  steps: StepSummary[];
}) {
  const { progress } = useSheetProgress();

  const solvedIn = (ids: string[]) =>
    ids.filter((id) => progress[`${sheetSlug}:${id}`] === 'solved').length;

  const graded = steps.some((s) => !!s.byLevel);

  const level = (name: 'easy' | 'medium' | 'hard') => {
    const ids = steps.flatMap((s) => s.byLevel?.[name] ?? []);
    return { solved: solvedIn(ids), total: ids.length };
  };

  const allIds = steps.flatMap((s) => s.ids);

  return (
    <>
      <SheetProgressHeader
        icon={Layers}
        title={sheetName}
        description={description}
        solved={solvedIn(allIds)}
        total={allIds.length}
        splits={
          graded
            ? [
                { label: 'Easy', ...level('easy') },
                { label: 'Medium', ...level('medium') },
                { label: 'Hard', ...level('hard') },
              ]
            : undefined
        }
      />

      <h2 className="mt-8 text-sm font-semibold tracking-tight">Steps</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => {
          const solved = solvedIn(step.ids);
          const total = step.ids.length;
          const pct = total > 0 ? (solved / total) * 100 : 0;
          const isComplete = total > 0 && solved === total;

          return (
            <Link
              key={step.slug}
              href={`/dsasheet/sheets/${sheetSlug}/${step.slug}`}
              className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 truncate text-sm font-semibold tracking-tight">
                    {step.title}
                  </h3>
                </div>
                {isComplete ? (
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-500"
                    strokeWidth={2}
                  />
                ) : (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </div>

              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="text-muted-foreground">{total} problems</span>
                  <span className="font-medium">
                    {solved}/{total}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      isComplete ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
