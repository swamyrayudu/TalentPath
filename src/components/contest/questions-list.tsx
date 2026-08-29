'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { Code2, Trophy, Clock, Lock, CheckCircle2 } from 'lucide-react';

interface QuestionsListProps {
  questions: Array<{
    id: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    points: number;
    orderIndex: number;
    timeLimitSeconds: number | null;
  }>;
  contestId: string;
  contestSlug: string;
  isParticipant: boolean;
  completedQuestionIds?: Set<string>;
  contestStatus: 'draft' | 'upcoming' | 'live' | 'ended';
  contestEndTime: Date;
}

export function QuestionsList({
  questions,
  contestSlug,
  isParticipant,
  completedQuestionIds,
  contestStatus,
  contestEndTime,
}: QuestionsListProps) {
  const [isContestEnded, setIsContestEnded] = useState(false);

  useEffect(() => {
    const checkContestStatus = () => {
      const now = new Date().getTime();
      const end = new Date(contestEndTime).getTime();
      setIsContestEnded(now > end || contestStatus === 'ended');
    };

    checkContestStatus();
    const interval = setInterval(checkContestStatus, 1000);

    return () => clearInterval(interval);
  }, [contestEndTime, contestStatus]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
        <Code2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        <h3 className="mt-4 text-sm font-semibold tracking-tight">No problems yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The organiser hasn&apos;t added any problems.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-2xl border bg-card">
      {questions.map((question, index) => {
        const isCompleted = completedQuestionIds?.has(question.id);

        return (
          <div
            key={question.id}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums ${
                  isCompleted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" strokeWidth={2} />
                ) : (
                  index + 1
                )}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{question.title}</h3>
                  {isCompleted && <Badge variant="secondary">Solved</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <DifficultyBadge difficulty={question.difficulty} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Trophy className="size-3.5" strokeWidth={1.75} />
                    {question.points} pts
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" strokeWidth={1.75} />
                    {question.timeLimitSeconds || 2}s
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 sm:pl-4">
              {isParticipant ? (
                isContestEnded ? (
                  <Button disabled variant="outline" size="sm" className="w-full sm:w-auto">
                    Contest ended
                  </Button>
                ) : (
                  <Button
                    variant={isCompleted ? 'outline' : 'default'}
                    size="sm"
                    className="w-full gap-2 sm:w-auto"
                    asChild
                  >
                    <Link href={`/contest/${contestSlug}/problem/${question.id}`}>
                      <Code2 className="size-4" />
                      {isCompleted ? 'View' : 'Solve'}
                    </Link>
                  </Button>
                )
              ) : (
                <Button disabled variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                  <Lock className="size-4" />
                  Join to solve
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
