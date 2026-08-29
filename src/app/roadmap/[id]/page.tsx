import React from 'react';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { roadmaps, roadmapSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getUserProgress } from '@/actions/roadmap';
import { RoadmapViewer } from '@/components/roadmap/roadmap-viewer';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { Badge } from '@/components/ui/badge';
import { Clock, Map } from 'lucide-react';

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'Roadmaps', href: '/roadmap' },
            { label: roadmap.title },
          ]}
        />

        <div className="mt-6">
          <SheetProgressHeader
            icon={Map}
            title={roadmap.title}
            description={roadmap.description ?? undefined}
            solved={completedSteps.length}
            total={steps.length}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {roadmap.difficulty}
                </Badge>
                {roadmap.estimatedTime && (
                  <Badge variant="outline" className="gap-1.5">
                    <Clock className="size-3" />
                    {roadmap.estimatedTime}
                  </Badge>
                )}
              </div>
            }
          />
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-tight">Learning path</h2>
          <div className="mt-3">
            <RoadmapViewer
              roadmapId={id}
              steps={steps}
              completedSteps={completedSteps}
              isLoggedIn={!!session?.user}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
