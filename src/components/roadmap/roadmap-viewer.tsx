'use client';
import React from 'react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  CheckCircle2, 
  ExternalLink,
  Lock,
  LogIn,
  BookOpen,
  Circle
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
      toast.error('Please sign in to track progress');
      signIn('google', { callbackUrl: window.location.href });
      return;
    }

    setLoading(stepId);
    try {
      await toggleStepCompletion(roadmapId, stepId);
      
      if (localCompleted.includes(stepId)) {
        setLocalCompleted(localCompleted.filter(id => id !== stepId));
        toast.success('Progress updated');
      } else {
        setLocalCompleted([...localCompleted, stepId]);
        toast.success('Step completed! 🎉');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to update progress');
    } finally {
      setLoading(null);
    }
  };

  if (steps.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No steps available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      {/* Vertical Connection Line - Responsive positioning */}
      <div className="absolute left-[22px] sm:left-[30px] top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-2 sm:space-y-3 relative">
        {steps.map((step, index) => {
          const isCompleted = localCompleted.includes(step.id);
          const isLoading = loading === step.id;

          return (
            <div key={step.id} className="relative flex items-start gap-2 sm:gap-3">
              {/* Step Circle with Checkbox - Mobile Optimized */}
              <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {/* Circle - Smaller on mobile */}
                <div
                  className={`w-[44px] h-[44px] sm:w-[60px] sm:h-[60px] rounded-lg flex items-center justify-center font-semibold text-xs sm:text-sm border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white shadow-sm'
                      : 'bg-card border-border hover:border-primary'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-base sm:text-lg">{index + 1}</span>
                  )}
                </div>

                {/* Checkbox - Responsive */}
                {isLoggedIn ? (
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleStep(step.id)}
                    disabled={isLoading}
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  />
                ) : (
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border border-muted-foreground/30 flex items-center justify-center">
                    <Lock className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content Card - Mobile Optimized */}
              <Sheet>
                <SheetTrigger asChild>
                  <Card
                    className={`flex-1 cursor-pointer transition-all hover:shadow-md min-w-0 ${
                      isCompleted
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-500/50'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="p-2 sm:p-2.5">
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        <h3
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isCompleted
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {step.title}
                        </h3>
                        {step.resources && (
                          <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>

                {/* Sheet Content - Mobile Optimized */}
                <SheetContent className="overflow-y-auto w-full max-w-full sm:max-w-md p-4 sm:p-6">
                  <SheetHeader className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 sm:px-2">
                        Step {index + 1}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-green-600 text-xs px-1.5 py-0.5 sm:px-2">
                          <CheckCircle2 className="h-3 w-3 mr-0.5 sm:mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                    <SheetTitle className="text-base sm:text-lg leading-tight">
                      {step.title}
                    </SheetTitle>
                    <SheetDescription className="text-xs sm:text-sm leading-relaxed">
                      {step.description}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Resources - Mobile Optimized */}
                    {step.resources && (
                      <div className="space-y-1.5 sm:space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          Resources
                        </h4>
                        <a
                          href={step.resources}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 sm:p-2 rounded-md border hover:bg-accent transition-colors text-xs sm:text-sm group break-all"
                        >
                          <span className="flex-1 line-clamp-2 break-words">
                            {step.resources}
                          </span>
                          <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Action Button - Mobile Optimized */}
                    {isLoggedIn ? (
                      <Button
                        onClick={() => handleToggleStep(step.id)}
                        disabled={isLoading}
                        className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        {isCompleted ? (
                          <>
                            <Circle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                            Mark Incomplete
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => signIn('google', { callbackUrl: window.location.href })}
                        className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          );
        })}
      </div>

      {/* Login Prompt - Mobile Optimized */}
      {!isLoggedIn && (
        <Card className="mt-3 sm:mt-4 border-primary/20 bg-primary/5">
          <CardContent className="p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium truncate">
                  Sign in to track progress
                </p>
              </div>
            </div>
            <Button
              onClick={() => signIn('google', { callbackUrl: window.location.href })}
              size="sm"
              className="flex-shrink-0 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <LogIn className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
