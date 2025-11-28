'use client';
import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  FileText,
  Circle,
  Trophy,
  PartyPopper
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
  const router = useRouter();
  const [localCompleted, setLocalCompleted] = useState<string[]>(completedSteps);
  const [loading, setLoading] = useState<string | null>(null);

  const allStepsCompleted = steps.length > 0 && localCompleted.length === steps.length;
  

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update progress');
      } else {
        toast.error('Failed to update progress');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleFinishRoadmap = () => {
    toast.success('Congratulations on completing this roadmap!', {
      description: 'Keep learning and explore more roadmaps.',
      duration: 5000,
    });
    router.push('/roadmap');
  };

  if (steps.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No steps available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completion Celebration Card */}
      {allStepsCompleted && isLoggedIn && (
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-md animate-pulse" />
                  <div className="relative bg-green-600 rounded-full p-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">
                  🎉 Roadmap Completed!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Congratulations! You&apos;ve successfully completed all {steps.length} steps in this learning path.
                </p>
              </div>
              <Button
                onClick={handleFinishRoadmap}
                className="bg-green-600 hover:bg-green-700 gap-2"
                size="lg"
              >
                <PartyPopper className="h-4 w-4" />
                Finish Roadmap
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps with Connection Line */}
      <div className="relative">
        {/* Vertical Connection Line */}
        <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const isCompleted = localCompleted.includes(step.id);
            const isLoading = loading === step.id;

            return (
              <div key={step.id} className="relative flex items-start gap-6">
                {/* Step Circle with Checkbox */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  {/* Circle */}
                  <div
                    className={`w-[105px] h-[105px] rounded-lg flex items-center justify-center font-bold text-lg border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30'
                        : 'bg-card border-border hover:border-primary hover:shadow-md'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl">{index + 1}</span>
                    )}
                  </div>

                  {/* Checkbox */}
                  {isLoggedIn ? (
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleStep(step.id)}
                      disabled={isLoading}
                      className="h-5 w-5"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content Card */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Card
                      className={`flex-1 cursor-pointer transition-all hover:shadow-lg ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-500/50'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3
                              className={`text-lg font-semibold mb-2 ${
                                isCompleted
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {step.description}
                            </p>
                          </div>
                          {step.resources && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </SheetTrigger>

                  {/* Sheet Content */}
                  <SheetContent className="overflow-y-auto sm:max-w-lg">
                    <SheetHeader className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          Step {index + 1}
                        </Badge>
                        {isCompleted && (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <SheetTitle className="text-2xl">{step.title}</SheetTitle>
                      <SheetDescription className="text-base leading-relaxed pt-2">
                        {step.description}
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6">
                      {/* Resources Section */}
                      {step.resources && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Free Resources
                          </h3>
                          <a
                            href={step.resources}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <div className="p-2 rounded-md bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">Official Documentation</p>
                              <p className="text-xs text-muted-foreground truncate">{step.resources}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Action Button */}
                      {isLoggedIn ? (
                        <Button
                          onClick={() => handleToggleStep(step.id)}
                          disabled={isLoading}
                          className="w-full"
                          variant={isCompleted ? 'outline' : 'default'}
                        >
                          {isCompleted ? (
                            <>
                              <Circle className="h-4 w-4 mr-2" />
                              Mark as Incomplete
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => signIn('google', { callbackUrl: window.location.href })}
                          className="w-full"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In to Track Progress
                        </Button>
                      )}

                      {/* Tip */}
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">
                          <strong>Tip:</strong> Complete this step to unlock your next milestone.
                        </p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Prompt */}
      {!isLoggedIn && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Sign in to track your progress</p>
                  <p className="text-sm text-muted-foreground">
                    Save your learning journey and earn achievements
                  </p>
                </div>
              </div>
              <Button
                onClick={() => signIn('google', { callbackUrl: window.location.href })}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
