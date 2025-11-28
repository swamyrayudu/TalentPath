
import React from 'react';

import { getAllRoadmaps } from '@/actions/roadmap';
import { auth } from '@/lib/auth';
import { getUserProgress } from '@/actions/roadmap';
import { db } from '@/lib/db';
import { roadmapSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Map, 
  Clock, 
  Target,
  ArrowRight,
  Code,
  Server,
  Smartphone,
  Database,
  Shield,
  Brain,
  CheckCircle2,
  Award,
  Lock
} from 'lucide-react';
import Link from 'next/link';

import type { LucideIcon } from 'lucide-react';
const categoryIcons: Record<string, LucideIcon> = {
  frontend: Code,
  backend: Server,
  fullstack: Database,
  mobile: Smartphone,
  devops: Target,
  'data-science': Database,
  'ai-ml': Brain,
  cybersecurity: Shield,
  other: Map,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Learning <span className="text-primary">Roadmaps</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Follow structured learning paths to master new technologies
          </p>
          
          {/* Login Notice */}
          {!session?.user && (
            <Card className="max-w-2xl mx-auto mt-6 border-primary/30 bg-primary/5 dark:bg-primary/10">
              <CardContent className="p-4">
                <p className="text-sm text-primary dark:text-primary">
                  You can view all roadmaps, but <strong>sign in to track your progress</strong> and earn achievements!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Roadmaps Grid */}
        {roadmapsWithProgress.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Map className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Roadmaps Available</h3>
              <p className="text-muted-foreground">
                Check back soon for new learning paths!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmapsWithProgress.map((roadmap) => {
              const IconComponent = categoryIcons[roadmap.category] || Map;
              
              return (
                <Card 
                  key={roadmap.id} 
                  className={`group hover:shadow-lg transition-all duration-300 relative flex flex-col h-full ${
                    roadmap.isCompleted ? 'border-green-500 border-2' : 'border-border'
                  }`}
                >
                  {/* Completion Badge - Top Right Corner */}
                  {roadmap.isCompleted && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-2 shadow-lg">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <CardHeader className="flex-none pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        roadmap.isCompleted 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-br from-primary to-primary/80'
                      }`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={difficultyColors[roadmap.difficulty]}>
                        {roadmap.difficulty}
                      </Badge>
                    </div>

                    <CardTitle className={`transition-colors line-clamp-1 ${
                      roadmap.isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'group-hover:text-primary'
                    }`}>
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {roadmap.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-end pt-0">
                    <div className="space-y-4">
                      {/* Progress Section - Fixed height container */}
                      <div className="min-h-[3.5rem]">
                        {session?.user && roadmap.progressPercentage > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className={`font-semibold ${
                                roadmap.isCompleted ? 'text-green-600' : 'text-primary'
                              }`}>
                                {Math.round(roadmap.progressPercentage)}%
                              </span>
                            </div>
                            <Progress 
                              value={roadmap.progressPercentage} 
                              className={`h-2 ${
                                roadmap.isCompleted ? '[&>div]:bg-green-600' : ''
                              }`}
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Status Section - Fixed height container */}
                      <div className="min-h-[2.5rem]">
                        {/* Not logged in notice */}
                        {!session?.user && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">Sign in to track progress</span>
                          </div>
                        )}

                        {/* Completion Badge */}
                        {roadmap.isCompleted && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <Award className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-600">
                              Completed! 🎉
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{roadmap.estimatedTime || 'Self-paced'}</span>
                      </div>

                      <Link href={`/roadmap/${roadmap.id}`} className="block">
                        <Button 
                          className={`w-full gap-2 ${
                            roadmap.isCompleted 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          }`}
                        >
                          {roadmap.isCompleted ? 'Review Roadmap' : session?.user ? 'Continue Learning' : 'View Roadmap'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}