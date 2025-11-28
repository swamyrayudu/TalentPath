
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Back to Contest Button */}
      <div className="mb-4 sm:mb-6">
        <Link href="/contest">
          <Button variant="ghost" size="sm" className="text-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Contests
          </Button>
        </Link>
      </div>

      <ContestHeader contest={{
        ...contest,
        creatorName: contest.creatorName || undefined
      }} />
      
      {/* Manage Contest Button - Only for Creator */}
      {isCreator && (
        <div className="mt-3 sm:mt-4">
          <Link href={`/contest/${slug}/manage`}>
            <Button size="sm" className="w-full md:w-auto text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Manage Contest
            </Button>
          </Link>
        </div>
      )}
      
      <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <ContestTimer contest={contest} />
          
          {!isParticipant && session?.user && (
            <div className="mb-6">
              <JoinContestButton contestId={contest.id} visibility={contest.visibility} />
            </div>
          )}

          {isParticipant && session?.user && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-md">
              <p className="text-sm sm:text-base text-primary font-medium flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                You are registered for this contest
              </p>
            </div>
          )}

          <Tabs defaultValue="problems" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-9 sm:h-10 p-0.5 sm:p-1">
              <TabsTrigger value="problems" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Problems</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Leaderboard</TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="problems" className="mt-3 sm:mt-4">
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

            <TabsContent value="leaderboard" className="mt-3 sm:mt-4">
              <ContestLeaderboard leaderboard={leaderboard} />
            </TabsContent>

            <TabsContent value="submissions" className="mt-3 sm:mt-4">
              {isParticipant && session?.user ? (
                <MySubmissionsList submissions={userSubmissions} />
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <p className="text-sm text-muted-foreground">
                    {!session?.user 
                      ? 'Please sign in to view your submissions' 
                      : 'Join the contest to see your submissions'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <ContestLeaderboard leaderboard={leaderboard} compact />
        </div>
      </div>
    </div>
  );
}
