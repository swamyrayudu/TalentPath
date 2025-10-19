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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/contest/${slug}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contest
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Manage Contest</h1>
        <p className="text-muted-foreground">{contest.title}</p>
      </div>

      <ContestManagementTabs contest={contest} questions={questions} contestSlug={slug} />
    </div>
  );
}
