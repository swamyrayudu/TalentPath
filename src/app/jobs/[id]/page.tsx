'use client';
import React from 'react';

import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  ExternalLink,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { SignInButton } from '../../../components/auth/sign-in-button';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, params.id),
  });

  if (!job || !job.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/jobs">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4 mb-4">
              {job.companyLogo ? (
                <img 
                  src={job.companyLogo} 
                  alt={job.company}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{job.location}</span>
                  </div>
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{job.locationType}</Badge>
              <Badge variant="secondary">{job.jobType}</Badge>
              {job.salary && (
                <Badge variant="outline" className="gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {job.salary} LPA
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
                Job Description
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {job.description}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
                Requirements
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {job.requirements}
              </p>
            </div>

            <div className="pt-6 border-t">
              {isLoggedIn ? (
                // Show Apply button for logged-in users
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                    Apply Now
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </a>
              ) : (
                // Show login prompt for guests
                <div className="space-y-4">
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100">
                      Sign in to apply
                    </AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      You need to be signed in to apply for this job. Sign in with your Google account to continue.
                    </AlertDescription>
                  </Alert>
                  <SignInButton />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
