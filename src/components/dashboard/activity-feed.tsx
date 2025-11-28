'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Trophy, 
  BookOpen, 
  Code2,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'problem_solved' | 'contest_joined' | 'roadmap_started' | 'step_completed';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    difficulty?: string;
    contestName?: string;
    roadmapName?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'problem_solved':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'contest_joined':
        return <Trophy className="h-4 w-4 text-primary" />;
      case 'roadmap_started':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'step_completed':
        return <Code2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null;
    
    const colors = {
      EASY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      HARD: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    
    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${colors[difficulty as keyof typeof colors]}`}
      >
        {difficulty}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest achievements and progress</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    {activity.metadata?.difficulty && 
                      getDifficultyBadge(activity.metadata.difficulty)
                    }
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Start solving problems or join contests!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
