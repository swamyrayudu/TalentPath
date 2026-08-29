'use client';
import React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Check,
  ExternalLink,
  Loader2,
  Lock,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { toggleStepCompletion } from '@/actions/roadmap';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import type { RoadmapStep } from '@/lib/db/schema';

export function RoadmapViewer({
  roadmapId,
  steps,
  completedSteps,
  isLoggedIn,
}: {
  roadmapId: string;
  steps: RoadmapStep[];
  completedSteps: string[];
  isLoggedIn: boolean;
}) {
  const [localCompleted, setLocalCompleted] = useState<string[]>(completedSteps);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStep = async (stepId: string) => {
    if (!isLoggedIn) {
      toast.error('Sign in to track your progress');
      signIn('google', { callbackUrl: window.location.href });
      return;
    }

    setLoading(stepId);
    try {
      await toggleStepCompletion(roadmapId, stepId);

      if (localCompleted.includes(stepId)) {
        setLocalCompleted(localCompleted.filter(id => id !== stepId));
      } else {
        setLocalCompleted([...localCompleted, stepId]);
      }
      toast.success('Progress updated');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : String(error) || 'Failed to update progress'
      );
    } finally {
      setLoading(null);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">No steps available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = localCompleted.includes(step.id);
          const isLoading = loading === step.id;

          return (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <button
                type="button"
                onClick={() => handleToggleStep(step.id)}
                disabled={isLoading}
                aria-label={
                  isLoggedIn
                    ? isCompleted
                      ? `Mark ${step.title} incomplete`
                      : `Mark ${step.title} complete`
                    : 'Sign in to track progress'
                }
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted-foreground/30 text-transparent hover:border-muted-foreground/60'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                ) : !isLoggedIn ? (
                  <Lock className="size-2.5 text-muted-foreground/60" strokeWidth={2.5} />
                ) : isCompleted ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : null}
              </button>

              <span className="w-6 shrink-0 text-sm text-muted-foreground tabular-nums">
                {index + 1}
              </span>

              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                    <span
                      className={`truncate text-sm ${
                        isCompleted ? 'text-muted-foreground' : 'font-medium'
                      }`}
                    >
                      {step.title}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </SheetTrigger>

                <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-md">
                  <SheetHeader className="space-y-3 p-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Step {index + 1}</Badge>
                      {isCompleted && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <SheetTitle className="text-lg leading-snug tracking-tight">
                      {step.title}
                    </SheetTitle>
                    <SheetDescription className="text-sm leading-relaxed">
                      {step.description}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-8 space-y-6">
                    {step.resources && (
                      <div>
                        <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          <BookOpen className="size-3.5" strokeWidth={1.75} />
                          Resources
                        </h3>
                        <a
                          href={step.resources}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors hover:border-primary/40"
                        >
                          <span className="min-w-0 flex-1 break-all">{step.resources}</span>
                          <ExternalLink
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={1.75}
                          />
                        </a>
                      </div>
                    )}

                    <Button
                      onClick={() => handleToggleStep(step.id)}
                      disabled={isLoading}
                      className="w-full"
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {!isLoggedIn
                        ? 'Sign in to track progress'
                        : isCompleted
                          ? 'Mark incomplete'
                          : 'Mark complete'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          );
        })}
      </div>

      {!isLoggedIn && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Sign in to tick steps off and keep your progress.
          </p>
          <Button
            size="sm"
            onClick={() => signIn('google', { callbackUrl: window.location.href })}
          >
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
}
