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
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <Code2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No Questions Yet</h3>
          <p className="text-sm text-muted-foreground">Questions will be added soon</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {questions.map((question, index) => {
        const isCompleted = completedQuestionIds?.has(question.id);
        
        return (
        <Card key={question.id} className={`hover:shadow-md transition-shadow ${isCompleted ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardHeader className="p-2.5 sm:p-3 md:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3">
              <div className="flex items-start gap-2 sm:gap-2.5 md:gap-4 flex-1 w-full">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full font-bold text-xs sm:text-sm md:text-base flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2">
                    <CardTitle className="text-sm sm:text-sm md:text-base leading-tight">{question.title}</CardTitle>
                    {isCompleted && (
                      <Badge className="bg-primary text-primary-foreground w-fit text-[10px] sm:text-[10px] px-1.5 py-0.5">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 flex-wrap">
                    <Badge className={`${getDifficultyColor(question.difficulty)} text-[10px] sm:text-[10px] px-1.5 py-0.5`}>
                      {question.difficulty}
                    </Badge>
                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[10px] md:text-xs text-muted-foreground">
                      <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
                      <span>{question.points} pts</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[10px] md:text-xs text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
                      <span>{question.timeLimitSeconds || 2}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {isParticipant ? (
                isContestEnded ? (
                  <Button disabled variant="outline" size="sm" className="w-full sm:w-auto text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3">
                    <Code2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                    Contest Ended
                  </Button>
                ) : (
                  <Link href={`/contest/${contestSlug}/problem/${question.id}`} className="w-full sm:w-auto">
                    <Button variant={isCompleted ? "outline" : "default"} size="sm" className="w-full text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3">
                      <Code2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                      {isCompleted ? 'View' : 'Solve'}
                    </Button>
                  </Link>
                )
              ) : (
                <Button disabled variant="outline" size="sm" className="w-full sm:w-auto text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
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
