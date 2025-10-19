import { notFound } from 'next/navigation';
import { getContest, getContestQuestions, getLeaderboard, checkParticipation, getQuestionCompletionStatus } from '@/actions/contest.actions';
import { ContestHeader } from '@/components/contest/contest-header';
import { ContestTimer } from '@/components/contest/contest-timer';
import { QuestionsList } from '@/components/contest/questions-list';
import { ContestLeaderboard } from '@/components/contest/leaderboard';
import { JoinContestButton } from '@/components/contest/join-contest-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <ContestHeader contest={{
        ...contest,
        creatorName: contest.creatorName || undefined
      }} />
      
      {/* Manage Contest Button - Only for Creator */}
      {isCreator && (
        <div className="mt-4">
          <Link href={`/contest/${slug}/manage`}>
            <Button size="lg" variant="outline" className="w-full md:w-auto">
              <Settings className="h-5 w-5 mr-2" />
              Manage Contest
            </Button>
          </Link>
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContestTimer contest={contest} />
          
          {!isParticipant && session?.user && (
            <div className="mb-6">
              <JoinContestButton contestId={contest.id} visibility={contest.visibility} />
            </div>
          )}

          {isParticipant && session?.user && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                <span className="text-xl">✓</span>
                You are registered for this contest
              </p>
            </div>
          )}

          <Tabs defaultValue="problems" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="problems" className="flex-1">Problems</TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
              <TabsTrigger value="submissions" className="flex-1">My Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="problems" className="mt-6">
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

            <TabsContent value="leaderboard" className="mt-6">
              <ContestLeaderboard leaderboard={leaderboard} />
            </TabsContent>

            <TabsContent value="submissions" className="mt-6">
              {/* Submissions list will be here */}
              <p className="text-muted-foreground">Your submissions will appear here</p>
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
