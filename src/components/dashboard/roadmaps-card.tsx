'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Map, Target, BookOpen, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface UserRoadmap {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
}

interface RoadmapsCardProps {
  roadmaps: UserRoadmap[];
}

export default function RoadmapsCard({ roadmaps }: RoadmapsCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case 'frontend':
      case 'backend':
      case 'fullstack':
        return <BookOpen className={iconClass} />;
      default:
        return <Target className={iconClass} />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Learning Roadmaps</CardTitle>
            <CardDescription>Track your learning journey</CardDescription>
          </div>
          <Map className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {roadmaps.length > 0 ? (
          <>
            <div className="space-y-4">
              {roadmaps.slice(0, 3).map((roadmap) => (
                <Link 
                  key={roadmap.id}
                  href={`/roadmap/${roadmap.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium line-clamp-1 mb-1">{roadmap.title}</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(roadmap.category)}
                            <span className="ml-1">{roadmap.category}</span>
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getDifficultyColor(roadmap.difficulty)}`}
                          >
                            {roadmap.difficulty}
                          </Badge>
                        </div>
                      </div>
                      {roadmap.progressPercentage === 100 && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium">
                          {roadmap.completedSteps} / {roadmap.totalSteps} steps
                        </span>
                      </div>
                      <Progress value={roadmap.progressPercentage} className="h-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link 
              href="/roadmap" 
              className="block w-full text-center py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              View All Roadmaps
            </Link>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">Start your learning journey</p>
            <Link 
              href="/roadmap"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Browse Roadmaps
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
