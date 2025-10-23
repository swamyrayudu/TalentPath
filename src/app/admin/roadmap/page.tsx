
import React from 'react';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAllRoadmaps } from '@/actions/roadmap';
import { RoadmapTable } from '@/components/admin/roadmap-table';
import { CreateRoadmapForm } from '@/components/admin/create-roadmap-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map } from 'lucide-react';

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  emailVerified?: boolean | string | null;
}

export default async function AdminRoadmaps() {
  const session = await auth();

  // Require logged in admin
  if (!session?.user) {
    redirect('/');
  }
  const role = (session.user as UserSession)?.role ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    redirect('/');
  }

  const roadmaps = await getAllRoadmaps();

  return (
    <div className="container mx-auto p-8">
      <Link href="/admin">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Button>
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8 text-amber-600" />
            Roadmap Management
          </h1>
          <p className="text-muted-foreground mt-2">Add, edit, and manage learning roadmaps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create Roadmap</CardTitle>
              <CardDescription>Quickly add a new learning roadmap</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateRoadmapForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Roadmaps</CardTitle>
              <CardDescription>Manage existing roadmaps and their steps</CardDescription>
            </CardHeader>
            <CardContent>
              <RoadmapTable roadmaps={roadmaps} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
