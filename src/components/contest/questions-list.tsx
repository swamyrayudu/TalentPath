'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, Clock, Lock, CheckCircle2 } from 'lucide-react';

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
  completedQuestionIds?: Set<string>;
  contestStatus: 'draft' | 'upcoming' | 'live' | 'ended';
  contestEndTime: Date;
}

export function QuestionsList({ questions, contestSlug, isParticipant, completedQuestionIds, contestStatus, contestEndTime }: QuestionsListProps) {
  const [isContestEnded, setIsContestEnded] = useState(false);

  useEffect(() => {
    const checkContestStatus = () => {
      const now = new Date().getTime();
      const end = new Date(contestEndTime).getTime();
      setIsContestEnded(now > end || contestStatus === 'ended');
    };

    checkContestStatus();
    const interval = setInterval(checkContestStatus, 1000);

    return () => clearInterval(interval);
  }, [contestEndTime, contestStatus]);
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
      {questions.map((question, index) => {
        const isCompleted = completedQuestionIds?.has(question.id);
        
        return (
        <Card key={question.id} className={`hover:shadow-md transition-shadow ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  isCompleted 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{question.title}</CardTitle>
                    {isCompleted && (
                      <Badge className="bg-green-500 text-white">
                        Completed
                      </Badge>
                    )}
                  </div>
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
                isContestEnded ? (
                  <Button disabled variant="outline">
                    <Code2 className="h-4 w-4 mr-2" />
                    Contest Ended
                  </Button>
                ) : (
                  <Link href={`/contest/${contestSlug}/problem/${question.id}`}>
                    <Button variant={isCompleted ? "outline" : "default"}>
                      <Code2 className="h-4 w-4 mr-2" />
                      {isCompleted ? 'View Solution' : 'Solve'}
                    </Button>
                  </Link>
                )
              ) : (
                <Button disabled variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Join to Solve
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )})}
    </div>
  );
}
