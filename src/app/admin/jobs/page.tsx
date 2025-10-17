import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAllJobs } from '@/actions/jobs';
import { JobsTable } from '@/components/admin/jobs-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Plus, ArrowLeft } from 'lucide-react';

export default async function AdminJobs() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  const jobs = await getAllJobs();

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
            <Briefcase className="h-8 w-8 text-purple-600" />
            Job Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage job postings
          </p>
        </div>
        <Link href="/admin/jobs/create">
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            Create New Job
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Postings</CardTitle>
          <CardDescription>
            Manage job listings, toggle active status, and edit details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobsTable jobs={jobs} />
        </CardContent>
      </Card>
    </div>
  );
}
