import { redirect } from 'next/navigation';
import { getContest, getContestQuestions } from '@/actions/contest.actions';
import { auth } from '@/lib/auth';
import { ContestManagementTabs } from '@/components/contest/contest-management-tabs';

export default async function ManageContestPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const contestResult = await getContest(params.slug);
  
  if (!contestResult.success || !contestResult.data) {
    redirect('/contest');
  }

  const contest = contestResult.data;

  // Check if user is the creator
  if (contest.createdBy !== session.user.id) {
    redirect(`/contest/${params.slug}`);
  }

  const questionsResult = await getContestQuestions(contest.id);
  const questions = questionsResult.success && questionsResult.data ? questionsResult.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Contest</h1>
        <p className="text-muted-foreground">{contest.title}</p>
      </div>

      <ContestManagementTabs contest={contest} questions={questions} contestSlug={params.slug} />
    </div>
  );
}
