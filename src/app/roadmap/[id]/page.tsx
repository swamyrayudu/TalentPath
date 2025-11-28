import React from 'react';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { roadmaps, roadmapSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getUserProgress } from '@/actions/roadmap';
import { RoadmapViewer } from '@/components/roadmap/roadmap-viewer';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Clock, 
  Target,
  Award,
  Code,
  Server,
  Smartphone,
  Database,
  Shield,
  Brain,
  Map,
  LucideIcon
} from 'lucide-react';
import Link from 'next/link';

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

export default async function RoadmapDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const { id } = await params;

  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.id, id),
  });

  if (!roadmap || !roadmap.isActive) {
    notFound();
  }

  const steps = await db
    .select()
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmapId, id))
    .orderBy(roadmapSteps.orderIndex);

  const userProgress = session?.user ? await getUserProgress(id) : null;
  
  // Safely parse completedSteps - handle array, string, or empty values
  let completedSteps: string[] = [];
  if (userProgress?.completedSteps) {
    if (Array.isArray(userProgress.completedSteps)) {
      completedSteps = userProgress.completedSteps;
    } else if (typeof userProgress.completedSteps === 'string') {
      try {
        const parsed = JSON.parse(userProgress.completedSteps);
        completedSteps = Array.isArray(parsed) ? parsed : [];
      } catch {
        completedSteps = [];
      }
    }
  }
  
  const progressPercentage = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  const IconComponent = categoryIcons[roadmap.category] || Map;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Link href="/roadmap">
          <Button variant="ghost" className="mb-6 hover:bg-accent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmaps
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="mb-8 border-2">
          <CardHeader className="space-y-6">
            {/* Title Section */}
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                  <IconComponent className="h-8 w-8" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <CardTitle className="text-3xl font-bold">
                      {roadmap.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {roadmap.description}
                  </CardDescription>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    <Server className="mr-1 h-3 w-3" />
                    {roadmap.category}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {roadmap.difficulty}
                  </Badge>
                  {roadmap.estimatedTime && (
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {roadmap.estimatedTime}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Target className="mr-1 h-3 w-3" />
                    {steps.length} Steps
                  </Badge>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            {session?.user && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Learning Progress</span>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {completedSteps.length} / {steps.length} completed
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {Math.round(progressPercentage)}% Complete
                    </p>
                  </div>
                  {progressPercentage === 100 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500">
                      <Award className="h-4 w-4" />
                      <span>Congratulations! Roadmap completed! 🎉</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardHeader>
        </Card>

        {/* Steps Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold">Learning Path</h2>
          </div>
          <RoadmapViewer
            roadmapId={id}
            steps={steps}
            completedSteps={completedSteps}
            isLoggedIn={!!session?.user}
          />
        </div>
      </div>
    </div>
  );
}
