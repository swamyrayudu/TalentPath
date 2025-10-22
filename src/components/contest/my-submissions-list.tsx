'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Code2,
  Trophy,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  questionId: string;
  questionTitle: string | null;
  code: string;
  language: string;
  verdict: string;
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number | null;
  errorMessage: string | null;
  submittedAt: Date;
}

interface MySubmissionsListProps {
  submissions: Submission[];
}

const getVerdictInfo = (verdict: string) => {
  switch (verdict) {
    case 'accepted':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        label: 'Accepted',
        badgeVariant: 'default' as const,
        badgeClassName: 'bg-emerald-500'
      };
    case 'wrong_answer':
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        label: 'Wrong Answer',
        badgeVariant: 'destructive' as const,
        badgeClassName: ''
      };
    case 'runtime_error':
      return {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        label: 'Runtime Error',
        badgeVariant: 'secondary' as const,
        badgeClassName: 'bg-orange-500/20'
      };
    case 'time_limit_exceeded':
      return {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        label: 'Time Limit',
        badgeVariant: 'secondary' as const,
        badgeClassName: 'bg-yellow-500/20'
      };
    case 'compilation_error':
      return {
        icon: Code2,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        label: 'Compilation Error',
        badgeVariant: 'secondary' as const,
        badgeClassName: 'bg-purple-500/20'
      };
    default:
      return {
        icon: Send,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
        label: 'Pending',
        badgeVariant: 'secondary' as const,
        badgeClassName: ''
      };
  }
};

export function MySubmissionsList({ submissions }: MySubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Send className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
          <p className="text-muted-foreground">
            Start solving problems to see your submissions here
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group submissions by question
  const submissionsByQuestion = submissions.reduce((acc, submission) => {
    const questionTitle = submission.questionTitle || 'Unknown Question';
    if (!acc[questionTitle]) {
      acc[questionTitle] = [];
    }
    acc[questionTitle].push(submission);
    return acc;
  }, {} as Record<string, Submission[]>);

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.verdict === 'accepted').length;
  const uniqueProblemsSolved = new Set(
    submissions.filter(s => s.verdict === 'accepted').map(s => s.questionId)
  ).size;
  const totalProblemsAttempted = Object.keys(submissionsByQuestion).length;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-3xl">{totalSubmissions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{acceptedSubmissions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Problems Solved</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{uniqueProblemsSolved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardDescription>Attempted</CardDescription>
            <CardTitle className="text-3xl text-purple-500">{totalProblemsAttempted}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Submissions List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            All Submissions
          </CardTitle>
          <CardDescription>
            Showing all {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''} across {totalProblemsAttempted} problem{totalProblemsAttempted !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {submissions.map((submission) => {
                const verdictInfo = getVerdictInfo(submission.verdict);
                const VerdictIcon = verdictInfo.icon;

                return (
                  <Card 
                    key={submission.id}
                    className={`border-2 ${verdictInfo.borderColor} ${verdictInfo.bgColor} transition-all hover:shadow-md`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <VerdictIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${verdictInfo.color}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate text-base">
                                {submission.questionTitle || 'Unknown Question'}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                              </p>
                            </div>
                            <Badge 
                              variant={verdictInfo.badgeVariant}
                              className={verdictInfo.badgeClassName}
                            >
                              {verdictInfo.label}
                            </Badge>
                          </div>

                          {/* Test Cases & Score */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Test Cases:</span>
                              <span className={`font-medium ${
                                submission.passedTestCases === submission.totalTestCases 
                                  ? 'text-emerald-500' 
                                  : 'text-orange-500'
                              }`}>
                                {submission.passedTestCases}/{submission.totalTestCases}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Score:</span>
                              <span className="font-medium text-blue-500">
                                {submission.score} pts
                              </span>
                            </div>
                            {submission.executionTimeMs !== null && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">
                                  {submission.executionTimeMs}ms
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Code2 className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium capitalize">
                                {submission.language}
                              </span>
                            </div>
                          </div>

                          {/* Error Message */}
                          {submission.errorMessage && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-xs font-mono text-red-600 dark:text-red-400">
                                {submission.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
