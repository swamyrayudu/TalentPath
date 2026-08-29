import React from 'react';
import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

import { auth } from '@/lib/auth';
import { AtsChecker } from '@/components/ats/ats-checker';
import { SignInButton } from '@/components/auth/sign-in-button';

export const metadata: Metadata = {
  title: 'ATS Resume Checker · TalentPath',
  description:
    'Upload your resume for an instant ATS score, targeted fixes, and jobs on TalentPath that match your skills.',
};

export default async function AtsPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">ATS Resume Checker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your resume and get an instant ATS score
          </p>
        </header>

        <div className="mt-8">
          {session?.user ? (
            <AtsChecker />
          ) : (
            <div className="rounded-2xl border p-6">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-muted-foreground" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold tracking-tight">Sign in to check your resume</h2>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your resume is analysed on request and is never stored.
              </p>
              <div className="mt-5">
                <SignInButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
