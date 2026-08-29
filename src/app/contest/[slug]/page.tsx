
import React from 'react';

import { notFound } from 'next/navigation';
import { getContest, getContestQuestions, getLeaderboard, checkParticipation, getQuestionCompletionStatus, getUserSubmissions } from '@/actions/contest.actions';
import { ContestHeader } from '@/components/contest/contest-header';
import { ContestTimer } from '@/components/contest/contest-timer';
import { QuestionsList } from '@/components/contest/questions-list';
import { ContestLeaderboard } from '@/components/contest/leaderboard';
import { JoinContestButton } from '@/components/contest/join-contest-button';
import { MySubmissionsList } from '@/components/contest/my-submissions-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContestDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const session = await auth();
  const { slug } = await params;
  const contestResult = await getContest(slug);
  
  if (!contestResult.success || !contestResult.data) {
    notFound();
  }

  const contest = contestResult.data;
  const questionsResult = await getContestQuestions(contest.id);
  const questions = questionsResult.success && questionsResult.data ? questionsResult.data : [];
  
  const leaderboardResult = await getLeaderboard(contest.id);
  const leaderboard = leaderboardResult.success && leaderboardResult.data ? leaderboardResult.data : [];

  const isParticipant = session?.user?.id ? 
    (await checkParticipation(contest.id, session.user.id)).isParticipant : false;

  const isCreator = session?.user?.id === contest.createdBy;

  // Get completion status for questions
  let completedQuestionIds = new Set<string>();
  if (session?.user?.id && isParticipant) {
    const statusResult = await getQuestionCompletionStatus(contest.id, session.user.id);
    if (statusResult.success && statusResult.data) {
      completedQuestionIds = statusResult.data;
    }
  }

  // Get user submissions for this contest
  let userSubmissions: Array<{
    id: string;
    questionId: string;
    questionTitle: string | null;
    code: string;
    language: string;
    verdict: string;
    score: number;
    passedTestCases: number;
    totalTestCases: number;
    executionTimeMs: number | null;
    errorMessage: string | null;
    submittedAt: Date;
  }> = [];
  if (session?.user?.id && isParticipant) {
    const submissionsResult = await getUserSubmissions(contest.id, session.user.id);
    if (submissionsResult.success && submissionsResult.data) {
      userSubmissions = submissionsResult.data.map(sub => ({
        ...sub,
        score: sub.score ?? 0,
        passedTestCases: sub.passedTestCases ?? 0,
        totalTestCases: sub.totalTestCases ?? 0,
      }));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/contest"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All contests
        </Link>

        <div className="mt-6">
          <ContestHeader
            contest={{
              ...contest,
              creatorName: contest.creatorName || undefined,
            }}
          />
        </div>

        {isCreator && (
          <div className="mt-5">
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link href={`/contest/${slug}/manage`}>
                <Settings className="size-4" />
                Manage contest
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <ContestTimer contest={contest} />

            {!isParticipant && session?.user && (
              <JoinContestButton contestId={contest.id} visibility={contest.visibility} />
            )}

            {isParticipant && session?.user && (
              <div className="flex items-center gap-2 rounded-2xl border bg-card px-5 py-3.5">
                <CheckCircle className="size-4 text-primary" strokeWidth={1.75} />
                <p className="text-sm">You are registered for this contest</p>
              </div>
            )}

            <Tabs defaultValue="problems" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="problems">Problems</TabsTrigger>
                <TabsTrigger value="leaderboard" className="lg:hidden">
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="problems" className="mt-4">
                <QuestionsList
                  questions={questions}
                  contestId={contest.id}
                  contestSlug={slug}
                  isParticipant={isParticipant}
                  completedQuestionIds={completedQuestionIds}
                  contestStatus={contest.status}
                  contestEndTime={contest.endTime}
                />
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-4 lg:hidden">
                <ContestLeaderboard leaderboard={leaderboard} />
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                {isParticipant && session?.user ? (
                  <MySubmissionsList submissions={userSubmissions} />
                ) : (
                  <div className="rounded-2xl border bg-card py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      {!session?.user
                        ? 'Sign in to view your submissions.'
                        : 'Join the contest to see your submissions.'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:col-span-1 lg:block">
            <ContestLeaderboard leaderboard={leaderboard} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
