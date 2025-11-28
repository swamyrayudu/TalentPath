
import React from 'react';

import { redirect } from 'next/navigation';
import { getContest, getContestQuestions } from '@/actions/contest.actions';
import { auth } from '@/lib/auth';
import { ContestManagementTabs } from '@/components/contest/contest-management-tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ManageContestPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { slug } = await params;
  const contestResult = await getContest(slug);
  
  if (!contestResult.success || !contestResult.data) {
    redirect('/contest');
  }

  const contest = contestResult.data;

  // Check if user is the creator
  if (contest.createdBy !== session.user.id) {
    redirect(`/contest/${slug}`);
  }

  const questionsResult = await getContestQuestions(contest.id);
  const questions = questionsResult.success && questionsResult.data ? questionsResult.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 space-y-4">
          <Link href={`/contest/${slug}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Contest
            </Button>
          </Link>
          
          <div className="rounded-lg bg-card border p-4 sm:p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Manage Contest</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{contest.title}</p>
          </div>
        </div>

        <ContestManagementTabs contest={contest} questions={questions} contestSlug={slug} />
      </div>
    </div>
  );
}
