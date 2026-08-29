import React from 'react';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { SHEETS, getSheet, hasDifficulty, stepProblems } from '@/lib/sheets';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetStepGrid, type StepSummary } from '@/components/dsa/sheet-step-grid';

export function generateStaticParams() {
  return SHEETS.map((sheet) => ({ sheet: sheet.slug }));
}

export default async function SheetPage({
  params,
}: {
  params: Promise<{ sheet: string }>;
}) {
  const { sheet: sheetSlug } = await params;

  const sheet = getSheet(sheetSlug);
  if (!sheet) notFound();

  const graded = hasDifficulty(sheet.steps.flatMap(stepProblems));

  const steps: StepSummary[] = sheet.steps.map((step) => {
    const problems = stepProblems(step);
    const idsFor = (level: 'easy' | 'medium' | 'hard') =>
      problems.filter((p) => p.difficulty === level).map((p) => p.id);

    return {
      slug: step.slug,
      title: step.title,
      ids: problems.map((p) => p.id),
      byLevel: graded
        ? { easy: idsFor('easy'), medium: idsFor('medium'), hard: idsFor('hard') }
        : undefined,
    };
  });

  const total = steps.reduce((n, s) => n + s.ids.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[{ label: 'DSA Sheets', href: '/dsasheet' }, { label: sheet.name }]}
        />

        <div className="mt-6">
          <SheetStepGrid
            sheetSlug={sheet.slug}
            sheetName={sheet.name}
            description={`${total} problems across ${sheet.steps.length} steps`}
            steps={steps}
          />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Problem list curated by {sheet.author}.{' '}
          <a
            href={sheet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
          >
            View the original sheet
            <ExternalLink className="size-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
