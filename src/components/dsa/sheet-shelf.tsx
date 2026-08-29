'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SHEET_CATALOG, type SheetSummary } from '@/lib/sheets/catalog';
import { useSheetProgress } from '@/components/dsa/use-sheet-progress';

function SheetCard({ sheet, solved }: { sheet: SheetSummary; solved: number }) {
  const pct = sheet.problemCount > 0 ? (solved / sheet.problemCount) * 100 : 0;
  const isComplete = solved > 0 && solved === sheet.problemCount;

  return (
    <Link
      href={`/dsasheet/sheets/${sheet.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {sheet.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">by {sheet.author}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {sheet.description}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="text-muted-foreground">
            {sheet.problemCount} problems · {sheet.stepCount} steps
          </span>
          <span className="font-medium">
            {solved}/{sheet.problemCount}
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
}

export function SheetShelf() {
  const { progress } = useSheetProgress();

  const solvedFor = (slug: string) =>
    Object.entries(progress).filter(
      ([key, status]) => status === 'solved' && key.startsWith(`${slug}:`)
    ).length;

  const totalProblems = SHEET_CATALOG.reduce((n, s) => n + s.problemCount, 0);

  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground tabular-nums">
        {SHEET_CATALOG.length} curated lists · {totalProblems.toLocaleString()} problems,
        tracked here alongside your own practice.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHEET_CATALOG.map((sheet) => (
          <SheetCard key={sheet.slug} sheet={sheet} solved={solvedFor(sheet.slug)} />
        ))}
      </div>
    </div>
  );
}
