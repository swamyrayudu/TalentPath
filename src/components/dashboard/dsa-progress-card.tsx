'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Bookmark, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface DSAProgressCardProps {
  stats: {
    solved: number;
    attempted: number;
    bookmarked: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function DSAProgressCard({ stats }: DSAProgressCardProps) {
  const total = stats.solved + stats.attempted;
  const progressPercentage = total > 0 ? (stats.solved / total) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>DSA Progress</CardTitle>
            <CardDescription>Your coding journey</CardDescription>
          </div>
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {stats.solved} / {total} solved
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center space-y-1 p-3 bg-primary/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {stats.solved}
            </span>
            <span className="text-xs text-muted-foreground">Solved</span>
          </div>

          <div className="flex flex-col items-center space-y-1 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <Circle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.attempted}
            </span>
            <span className="text-xs text-muted-foreground">Attempted</span>
          </div>

          <div className="flex flex-col items-center space-y-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.bookmarked}
            </span>
            <span className="text-xs text-muted-foreground">Bookmarked</span>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">By Difficulty</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  Easy
                </Badge>
              </div>
              <span className="text-sm font-medium">{stats.easy}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  Medium
                </Badge>
              </div>
              <span className="text-sm font-medium">{stats.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  Hard
                </Badge>
              </div>
              <span className="text-sm font-medium">{stats.hard}</span>
            </div>
          </div>
        </div>

        <Link 
          href="/dsasheet" 
          className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          View All Problems
        </Link>
      </CardContent>
    </Card>
  );
}
