'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, TestTube, Code2 } from 'lucide-react';
import { deleteQuestion } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QuestionManagementListProps {
  questions: any[];
  contestId: string;
  contestSlug: string;
}

export function QuestionManagementList({ questions, contestId, contestSlug }: QuestionManagementListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setDeletingId(questionId);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast.success('Question deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete question');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HARD':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Code2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
          <p className="text-muted-foreground">Add your first question to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{question.title}</CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline">{question.points} points</Badge>
                    <Badge variant="outline">{question.timeLimitSeconds}s</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/contest/${contestSlug}/manage/question/${question.id}/test-cases`}>
                  <Button size="sm" variant="outline">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Cases
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(question.id)}
                  disabled={deletingId === question.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
