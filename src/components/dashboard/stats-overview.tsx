'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Code2, 
  Trophy, 
  Map, 
  TrendingUp 
} from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    problemsSolved: number;
    contestsParticipated: number;
    roadmapsInProgress: number;
    currentStreak: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      title: 'Problems Solved',
      value: stats.problemsSolved,
      icon: Code2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Contests Joined',
      value: stats.contestsParticipated,
      icon: Trophy,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Roadmaps',
      value: stats.roadmapsInProgress,
      icon: Map,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {index === 0 && 'Keep coding!'}
                {index === 1 && 'Compete more'}
                {index === 2 && 'Keep learning'}
                {index === 3 && 'Great progress!'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
