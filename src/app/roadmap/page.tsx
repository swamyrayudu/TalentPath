import React from 'react';

import { getAllRoadmaps } from '@/actions/roadmap';
import { auth } from '@/lib/auth';
import { getUserProgress } from '@/actions/roadmap';
import { db } from '@/lib/db';
import { roadmapSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Map, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const difficultyTone: Record<string, string> = {
  beginner: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  intermediate: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  advanced: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
};

export default async function RoadmapPage() {
  const session = await auth();
  const roadmaps = await getAllRoadmaps();

  // Get completion status for each roadmap if user is logged in
  const roadmapsWithProgress = await Promise.all(
    roadmaps.map(async (roadmap) => {
      if (!session?.user) {
        return { ...roadmap, progressPercentage: 0, isCompleted: false };
      }

      const userProgress = await getUserProgress(roadmap.id);
      const steps = await db
        .select()
        .from(roadmapSteps)
        .where(eq(roadmapSteps.roadmapId, roadmap.id));

      if (!userProgress || steps.length === 0) {
        return { ...roadmap, progressPercentage: 0, isCompleted: false };
      }

      let completedSteps: string[] = [];
      try {
        // Handle if completedSteps is already an array
        if (Array.isArray(userProgress.completedSteps)) {
          completedSteps = userProgress.completedSteps;
        } else if (typeof userProgress.completedSteps === 'string') {
          const stepsData = userProgress.completedSteps.trim() || '[]';
          const parsed = JSON.parse(stepsData);
          completedSteps = Array.isArray(parsed) ? parsed : [];
        } else {
          completedSteps = [];
        }
      } catch (error) {
        console.error('Error parsing completed steps:', error);
        completedSteps = [];
      }

      const progressPercentage = (completedSteps.length / steps.length) * 100;
      const isCompleted = progressPercentage === 100;

      return { ...roadmap, progressPercentage, isCompleted };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Learning roadmaps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session?.user
              ? 'Structured paths from where you are to the role you want.'
              : 'Browse every path — sign in to track your progress.'}
          </p>
        </div>

        {/* ── Roadmaps ───────────────────────────────────────────── */}
        {roadmapsWithProgress.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Map className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h2 className="mt-4 text-sm font-semibold tracking-tight">
              No roadmaps yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon for new learning paths.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmapsWithProgress.map((roadmap) => (
              <Link
                key={roadmap.id}
                href={`/roadmap/${roadmap.id}`}
                className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold leading-snug tracking-tight">
                    {roadmap.title}
                  </h2>
                  <Badge
                    variant="outline"
                    className={`shrink-0 capitalize ${
                      difficultyTone[roadmap.difficulty] ?? ''
                    }`}
                  >
                    {roadmap.difficulty}
                  </Badge>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {roadmap.description}
                </p>

                <div className="mt-auto pt-5">
                  {session?.user && roadmap.progressPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {roadmap.isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" strokeWidth={2} />
                              Completed
                            </span>
                          ) : (
                            'Progress'
                          )}
                        </span>
                        <span className="font-medium tabular-nums">
                          {Math.round(roadmap.progressPercentage)}%
                        </span>
                      </div>
                      <Progress
                        value={roadmap.progressPercentage}
                        className={`mt-2 h-1.5 ${
                          roadmap.isCompleted ? '[&>div]:bg-emerald-500' : ''
                        }`}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" strokeWidth={1.75} />
                      {roadmap.estimatedTime || 'Self-paced'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {roadmap.isCompleted
                        ? 'Review'
                        : roadmap.progressPercentage > 0
                          ? 'Continue'
                          : 'View'}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
