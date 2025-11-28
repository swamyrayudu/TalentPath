'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Send, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContestStatsCardProps {
  stats: {
    totalSubmissions: number;
    totalAccepted: number;
    uniqueProblemsSolved: number;
    questionStats: Array<{
      questionId: string;
      questionTitle: string;
      totalSubmissions: number;
      acceptedSubmissions: number;
      lastSubmittedAt: Date | null;
    }>;
    recentSubmissions: Array<{
      id: string;
      questionTitle: string | null;
      verdict: string;
      submittedAt: Date;
    }>;
  };
}

export function ContestStatsCard({ stats }: ContestStatsCardProps) {
  const acceptanceRate = stats.totalSubmissions > 0 
    ? ((stats.totalAccepted / stats.totalSubmissions) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Contest Submissions
        </CardTitle>
        <CardDescription>Your contest problem submission statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Submissions</p>
            <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.totalAccepted}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Problems Solved</p>
            <p className="text-2xl font-bold text-blue-500">{stats.uniqueProblemsSolved}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Acceptance Rate</p>
            <p className="text-2xl font-bold text-purple-500">{acceptanceRate}%</p>
          </div>
        </div>

        {/* Submissions by Question */}
        {stats.questionStats.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Submissions by Question</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {stats.questionStats.map((question) => (
                <div
                  key={question.questionId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{question.questionTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {question.totalSubmissions} {question.totalSubmissions === 1 ? 'submission' : 'submissions'}
                      </span>
                      {question.acceptedSubmissions > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {question.acceptedSubmissions} accepted
                        </span>
                      )}
                    </div>
                    {question.lastSubmittedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last: {formatDistanceToNow(new Date(question.lastSubmittedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <Badge
                      variant={question.acceptedSubmissions > 0 ? "default" : "secondary"}
                      className={question.acceptedSubmissions > 0 ? "bg-emerald-500" : ""}
                    >
                      {question.acceptedSubmissions > 0 ? 'Solved' : 'Attempted'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {question.totalSubmissions}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalSubmissions === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contest submissions yet</p>
            <p className="text-sm mt-2">Join a contest and start solving!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
