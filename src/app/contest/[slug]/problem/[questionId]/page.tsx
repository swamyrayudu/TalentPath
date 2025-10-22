
import React from 'react';

import { notFound, redirect } from 'next/navigation';
import { getContest, getQuestion, getSampleTestCases, checkParticipation } from '@/actions/contest.actions';
import { ProblemSolver } from '@/components/contest/problem-solver';
import { auth } from '@/lib/auth';

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string; questionId: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { slug, questionId } = await params;

  const contestResult = await getContest(slug);
  if (!contestResult.success || !contestResult.data) {
    notFound();
  }

  const contest = contestResult.data;
  
  // Check if user is participant
  const participationCheck = await checkParticipation(contest.id, session.user.id);
  if (!participationCheck.isParticipant) {
    redirect(`/contest/${slug}`);
  }

  // Check if contest is live
  const now = new Date();
  const isLive = now >= contest.startTime && now <= contest.endTime;
  
  if (!isLive) {
    redirect(`/contest/${slug}`);
  }

  const questionResult = await getQuestion(questionId);
  if (!questionResult.success || !questionResult.data) {
    notFound();
  }

  const questionRaw = questionResult.data;
  const question = {
    ...questionRaw,
    timeLimitSeconds: questionRaw.timeLimitSeconds ?? 0,
    memoryLimitMb: questionRaw.memoryLimitMb ?? 0,
  };
  const testCasesResult = await getSampleTestCases(questionId);
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
