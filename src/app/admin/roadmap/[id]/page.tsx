import React from 'react'
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { roadmaps, roadmapSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { RoadmapStepsManager } from '@/components/admin/roadmap-steps-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Map, Eye } from 'lucide-react';

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  emailVerified?: boolean | string | null;
}

export default async function EditRoadmap({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as UserSession)?.role;
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.id, id),
  });

  if (!roadmap) {
    notFound();
  }

  const steps = await db
    .select()
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmapId, id))
    .orderBy(roadmapSteps.orderIndex);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/roadmap">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmaps
          </Button>
        </Link>
        <Link href={`/roadmap/${id}`} target="_blank">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview Public View
          </Button>
        </Link>
      </div>

      {/* Roadmap Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-6 w-6 text-amber-600" />
                <CardTitle className="text-2xl">{roadmap.title}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {roadmap.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">{roadmap.category}</Badge>
              <Badge variant="secondary" className="capitalize">{roadmap.difficulty}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Steps Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Roadmap Steps</CardTitle>
          <CardDescription>
            Add and manage learning steps for this roadmap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoadmapStepsManager roadmapId={id} initialSteps={steps} />
        </CardContent>
      </Card>
    </div>
  );
}
