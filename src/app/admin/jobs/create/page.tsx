'use client';
import React from 'react';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { CreateJobForm } from '@/components/admin/create-job-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default async function CreateJob() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }
  const role = ((session.user as Record<string, unknown>)?.role as string) ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    // Redirect non-admin users to home (or a 403 page if you prefer)
    redirect('/');
  }
  // Admin role check removed — allow any logged-in user to access job creation UI.

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Link href="/admin/jobs">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-purple-600" />
            <CardTitle>Create New Job</CardTitle>
          </div>
          <CardDescription>
            Fill in the details to post a new job opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateJobForm />
        </CardContent>
      </Card>
    </div>
  );
}
