import { notFound, redirect } from 'next/navigation';
import { getContest, getQuestion, getSampleTestCases, checkParticipation } from '@/actions/contest.actions';
import { ProblemSolver } from '@/components/contest/problem-solver';
import { auth } from '@/lib/auth';

export default async function ProblemPage({
  params,
}: {
  params: { slug: string; questionId: string };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const contestResult = await getContest(params.slug);
  if (!contestResult.success || !contestResult.data) {
    notFound();
  }

  const contest = contestResult.data;
  
  // Check if user is participant
  const participationCheck = await checkParticipation(contest.id, session.user.id);
  if (!participationCheck.isParticipant) {
    redirect(`/contest/${params.slug}`);
  }

  // Check if contest is live
  const now = new Date();
  const isLive = now >= contest.startTime && now <= contest.endTime;
  
  if (!isLive) {
    redirect(`/contest/${params.slug}`);
  }

  const questionResult = await getQuestion(params.questionId);
  if (!questionResult.success || !questionResult.data) {
    notFound();
  }

  const question = questionResult.data;
  const testCasesResult = await getSampleTestCases(params.questionId);
  const sampleTestCases = testCasesResult.success && testCasesResult.data ? testCasesResult.data : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col pt-4">
      <ProblemSolver
        contest={contest}
        question={question}
        sampleTestCases={sampleTestCases}
        userId={session.user.id}
      />
    </div>
  );
}
