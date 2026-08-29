'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Code2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  questionId: string;
  questionTitle: string | null;
  code: string;
  language: string;
  verdict: string;
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number | null;
  errorMessage: string | null;
  submittedAt: Date;
}

interface MySubmissionsListProps {
  submissions: Submission[];
}

/** Verdicts read from the border colour of a single badge, not a tinted card. */
const VERDICTS: Record<string, { label: string; tone: string }> = {
  accepted: {
    label: 'Accepted',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  },
  wrong_answer: {
    label: 'Wrong answer',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
  },
  runtime_error: {
    label: 'Runtime error',
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
  },
  time_limit_exceeded: {
    label: 'Time limit',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  },
  compilation_error: {
    label: 'Compilation error',
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
  },
};

const verdictOf = (verdict: string) =>
  VERDICTS[verdict] ?? { label: 'Pending', tone: '' };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export function MySubmissionsList({ submissions }: MySubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
        <Send className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        <h3 className="mt-4 text-sm font-semibold tracking-tight">No submissions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Solve a problem to see your attempts here.
        </p>
      </div>
    );
  }

  const attemptedProblems = new Set(submissions.map((s) => s.questionId)).size;
  const accepted = submissions.filter((s) => s.verdict === 'accepted');
  const solved = new Set(accepted.map((s) => s.questionId)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Submissions" value={submissions.length} />
        <Stat label="Accepted" value={accepted.length} />
        <Stat label="Solved" value={solved} />
        <Stat label="Attempted" value={attemptedProblems} />
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight">All submissions</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {submissions.length} across {attemptedProblems} problem
            {attemptedProblems === 1 ? '' : 's'}
          </span>
        </div>

        <ScrollArea className="h-[560px]">
          <div className="divide-y">
            {submissions.map((submission) => {
              const verdict = verdictOf(submission.verdict);

              return (
                <div key={submission.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">
                        {submission.questionTitle || 'Unknown problem'}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.submittedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className={verdict.tone}>
                      {verdict.label}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {submission.passedTestCases}/{submission.totalTestCases} test cases
                    </span>
                    <span className="tabular-nums">{submission.score} pts</span>
                    {submission.executionTimeMs !== null && (
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Clock className="size-3.5" strokeWidth={1.75} />
                        {submission.executionTimeMs}ms
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 capitalize">
                      <Code2 className="size-3.5" strokeWidth={1.75} />
                      {submission.language}
                    </span>
                  </div>

                  {submission.errorMessage && (
                    <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                      {submission.errorMessage}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}
