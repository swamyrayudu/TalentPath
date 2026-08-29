
import React from 'react';

import { redirect } from 'next/navigation';
import { getContest, getContestQuestions } from '@/actions/contest.actions';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { ContestManagementTabs } from '@/components/contest/contest-management-tabs';
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href={`/contest/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to contest
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Manage contest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{contest.title}</p>
        </div>

        <div className="mt-8">
          <ContestManagementTabs contest={contest} questions={questions} contestSlug={slug} />
        </div>
      </div>
    </div>
  );
}
