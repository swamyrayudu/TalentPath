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
  Circle,
  ChevronRight,
  MousePointerClick
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
      {/* Vertical Connection Line */}
      <div className="absolute left-6 sm:left-7 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border" />

      <div className="space-y-4 relative">
        {steps.map((step, index) => {
          const isCompleted = localCompleted.includes(step.id);
          const isLoading = loading === step.id;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Step Circle with Checkbox */}
              <div className="relative z-10 flex flex-col items-center gap-2 flex-shrink-0">
                {/* Circle */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all duration-200 shadow-sm ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border hover:border-primary hover:shadow-md'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <span className="text-lg">{index + 1}</span>
                  )}
                </div>

                {/* Checkbox */}
                {isLoggedIn ? (
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleStep(step.id)}
                    disabled={isLoading}
                    className="h-4 w-4 cursor-pointer border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                ) : (
                  <div className="w-4 h-4 rounded border border-muted-foreground/30 flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content Card */}
              <Sheet>
                <SheetTrigger asChild>
                  <Card
                    className={`flex-1 cursor-pointer transition-all duration-200 min-w-0 group ${
                      isCompleted
                        ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
                        : 'hover:border-primary hover:shadow-md hover:bg-accent/30'
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm sm:text-base font-semibold ${
                              isCompleted
                                ? 'text-primary line-through opacity-70'
                                : 'text-foreground'
                            }`}
                          >
                            {step.title}
                          </h3>
                          {/* Click hint */}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                            <MousePointerClick className="h-3 w-3" />
                            <span>Click to view details</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCompleted && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                              Completed
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>

                {/* Sheet Content */}
                <SheetContent className="overflow-y-auto w-full max-w-full sm:max-w-md p-4 sm:p-6">
                  <SheetHeader className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        Step {index + 1}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <SheetTitle className="text-lg sm:text-xl leading-tight">
                      {step.title}
                    </SheetTitle>
                    <SheetDescription className="text-sm leading-relaxed">
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
