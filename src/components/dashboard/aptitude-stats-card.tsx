'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, TrendingUp } from 'lucide-react';

interface AptitudeStats {
  totalTests: number;
  averageScore: number;
  bestScore: number;
  topicStats: {
    topic: string;
    testsCompleted: number;
    averageScore: number;
    bestScore: number;
  }[];
  recentTests: {
    id: string;
    topic: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: Date;
  }[];
}

interface AptitudeStatsCardProps {
  stats: AptitudeStats;
}

export function AptitudeStatsCard({ stats }: AptitudeStatsCardProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Aptitude Performance
        </CardTitle>
        <CardDescription>Your aptitude test statistics</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.totalTests === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No aptitude tests taken yet</p>
            <p className="text-sm mt-2">Start taking aptitude quizzes to see your progress!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="text-2xl font-bold text-purple-600">{stats.totalTests}</div>
                <div className="text-xs text-muted-foreground mt-1">Tests Taken</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">{stats.bestScore}%</div>
                <div className="text-xs text-muted-foreground mt-1">Best Score</div>
              </div>
            </div>

            {/* Topic Performance */}
            {stats.topicStats.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Top Topics
                </h4>
                {stats.topicStats.slice(0, 3).map((topicStat) => (
                  <div key={topicStat.topic} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {topicStat.topic.replace(/-/g, ' ')}
                      </span>
                      <span className="text-muted-foreground">
                        {topicStat.averageScore}%
                      </span>
                    </div>
                    <Progress 
                      value={topicStat.averageScore} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Recent Tests */}
            {stats.recentTests.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Tests
                </h4>
                {stats.recentTests.slice(0, 5).map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">
                        {test.topic.replace(/-/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          test.score >= 80
                            ? 'border-green-500 text-green-500'
                            : test.score >= 60
                            ? 'border-blue-500 text-blue-500'
                            : 'border-amber-500 text-amber-500'
                        }
                      >
                        {test.score}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {test.correctAnswers}/{test.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
