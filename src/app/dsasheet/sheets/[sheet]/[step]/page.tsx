import React from 'react';
import { notFound } from 'next/navigation';

import { SHEETS, getSheet, getStep, stepProblems } from '@/lib/sheets';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetProblemList } from '@/components/dsa/sheet-problem-list';

export function generateStaticParams() {
  return SHEETS.flatMap((sheet) =>
    sheet.steps.map((step) => ({ sheet: sheet.slug, step: step.slug }))
  );
}

export default async function SheetStepPage({
  params,
}: {
  params: Promise<{ sheet: string; step: string }>;
}) {
  const { sheet: sheetSlug, step: stepSlug } = await params;

  const sheet = getSheet(sheetSlug);
  if (!sheet) notFound();

  const step = getStep(sheet, stepSlug);
  if (!step) notFound();

  const problems = stepProblems(step);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'DSA Sheets', href: '/dsasheet' },
            { label: sheet.name, href: `/dsasheet/sheets/${sheet.slug}` },
            { label: step.title },
          ]}
        />

        <div className="mt-6">
          <SheetProblemList
            sheetSlug={sheet.slug}
            title={step.title}
            description={`${problems.length} problems · ${sheet.name}`}
            subSteps={step.subSteps}
          />
        </div>
      </div>
    </div>
  );
}
