'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ContestSubmissionsPreviewProps {
  stats: {
    totalSubmissions: number;
    totalAccepted: number;
    uniqueProblemsSolved: number;
    questionStats: Array<{
      questionId: string;
      questionTitle: string;
      totalSubmissions: number;
      acceptedSubmissions: number;
    }>;
  };
}

export function ContestSubmissionsPreview({ stats }: ContestSubmissionsPreviewProps) {
  const topSubmissions = stats.questionStats.slice(0, 5);
  const acceptanceRate = stats.totalSubmissions > 0 
    ? ((stats.totalAccepted / stats.totalSubmissions) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Contest Submissions Overview
        </CardTitle>
        <CardDescription>Your contest problem solving activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border">
            <p className="text-xs text-muted-foreground mb-1">Submissions</p>
            <p className="text-xl font-bold">{stats.totalSubmissions}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">Accepted</p>
            <p className="text-xl font-bold text-emerald-500">{stats.totalAccepted}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-muted-foreground mb-1">Problems</p>
            <p className="text-xl font-bold text-blue-500">{stats.uniqueProblemsSolved}</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <p className="text-xs text-muted-foreground mb-1">Accept Rate</p>
            <p className="text-xl font-bold text-purple-500">{acceptanceRate}%</p>
          </div>
        </div>

        {/* Top Submitted Problems */}
        {topSubmissions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Most Attempted Problems</h4>
            <div className="space-y-2">
              {topSubmissions.map((question) => (
                <div
                  key={question.questionId}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{question.questionTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {question.totalSubmissions}x attempted
                      </span>
                      {question.acceptedSubmissions > 0 && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={question.acceptedSubmissions > 0 ? "default" : "secondary"}
                    className={question.acceptedSubmissions > 0 ? "bg-emerald-500" : ""}
                  >
                    {question.acceptedSubmissions > 0 ? 'Solved' : 'Trying'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalSubmissions === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No contest submissions yet</p>
            <p className="text-xs mt-1">Join a contest and start solving!</p>
          </div>
        )}

        {/* View More Link */}
        {stats.totalSubmissions > 0 && (
          <Link href="/dashboard">
            <Button variant="outline" className="w-full gap-2">
              View Full Statistics
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
