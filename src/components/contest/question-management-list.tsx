'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, TestTube, Code2, Trophy, Clock, Target, Zap, Award } from 'lucide-react';
import { deleteQuestion } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  timeLimitSeconds: number;
}

interface QuestionManagementListProps {
  questions: Question[];
  contestId: string;
  contestSlug: string;
}

export function QuestionManagementList({ questions, contestSlug }: QuestionManagementListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const handleDelete = async (questionId: string) => {
    setDeletingId(questionId);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast.success('Question deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setDeletingId(null);
      setQuestionToDelete(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
      case 'MEDIUM':
        return 'border-amber-500/40 text-amber-600 dark:text-amber-400';
      case 'HARD':
        return 'border-rose-500/40 text-rose-600 dark:text-rose-400';
      default:
        return '';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return <Target className="h-3.5 w-3.5" />;
      case 'MEDIUM':
        return <Zap className="h-3.5 w-3.5" />;
      case 'HARD':
        return <Award className="h-3.5 w-3.5" />;
      default:
        return <Code2 className="h-3.5 w-3.5" />;
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
        <Code2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        <h3 className="mt-4 text-sm font-semibold tracking-tight">No questions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first question to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {questions.map((question, index) => (
        <Card 
          key={question.id} 
          className="group overflow-hidden transition-colors hover:border-primary/40"
        >
          <CardContent className="p-4 sm:p-6">
            {/* Mobile & Desktop Layout */}
            <div className="space-y-4">
              {/* Header Row */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Number Badge */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-medium text-muted-foreground tabular-nums">
                  {index + 1}
                </div>
                
                {/* Title and Badges */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {question.title}
                  </h3>
                  
                  {/* Info Grid - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Badge variant="outline" className={`${getDifficultyColor(question.difficulty)} flex items-center gap-1.5`}>
                        {getDifficultyIcon(question.difficulty)}
                        <span className="font-semibold">{question.difficulty}</span>
                      </Badge>
                    </div>
                    
                    {/* Points */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold">{question.points}</span>
                      <span className="text-xs text-muted-foreground">points</span>
                    </div>
                    
                    {/* Time Limit */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-500 flex-shrink-0" />
                      <span className="text-sm font-semibold">{question.timeLimitSeconds}</span>
                      <span className="text-xs text-muted-foreground">seconds</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Full Width on Mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-border">
                <Link href={`/contest/${contestSlug}/manage/question/${question.id}/test-cases`} className="flex-1">
                  <Button 
                    size="default" 
                    variant="outline" 
                    className="w-full sm:w-auto font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Manage Test Cases
                  </Button>
                </Link>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={() => setQuestionToDelete(question.id)}
                  disabled={deletingId === question.id}
                  className="w-full sm:w-auto font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingId === question.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and all its test cases. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => questionToDelete && handleDelete(questionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
