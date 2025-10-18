import { redirect } from 'next/navigation';
import { getQuestion, getAllTestCases, getContest } from '@/actions/contest.actions';
import { auth } from '@/lib/auth';
import { TestCaseManager } from '@/components/contest/test-case-manager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TestCasesPage({ 
  params 
}: { 
  params: { slug: string; questionId: string } 
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const questionResult = await getQuestion(params.questionId);
  
  if (!questionResult.success || !questionResult.data) {
    redirect('/contest');
  }

  const question = questionResult.data;
  const testCasesResult = await getAllTestCases(params.questionId);
  const testCases = testCasesResult.success && testCasesResult.data ? testCasesResult.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/contest/${params.slug}/manage`}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Contest
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Test Cases</h1>
        <p className="text-muted-foreground">{question.title}</p>
      </div>

      <TestCaseManager questionId={params.questionId} testCases={testCases} />
    </div>
  );
}
