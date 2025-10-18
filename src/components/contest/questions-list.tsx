import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, Clock, Lock } from 'lucide-react';

interface QuestionsListProps {
  questions: Array<{
    id: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    points: number;
    orderIndex: number;
    timeLimitSeconds: number | null;
  }>;
  contestId: string;
  contestSlug: string;
  isParticipant: boolean;
}

export function QuestionsList({ questions, contestId, contestSlug, isParticipant }: QuestionsListProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HARD':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Code2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
          <p className="text-muted-foreground">Questions will be added soon</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
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
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>{question.points} points</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{question.timeLimitSeconds || 2}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {isParticipant ? (
                <Link href={`/contest/${contestSlug}/problem/${question.id}`}>
                  <Button>
                    <Code2 className="h-4 w-4 mr-2" />
                    Solve
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Join to Solve
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
