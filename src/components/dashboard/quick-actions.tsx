'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Trophy, 
  Briefcase, 
  Map, 
  FileText,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      title: 'Solve Problems',
      description: 'Practice DSA questions',
      icon: Code2,
      href: '/dsasheet',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Join Contest',
      description: 'Compete with others',
      icon: Trophy,
      href: '/contest',
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
      title: 'Browse Jobs',
      description: 'Find opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Start Learning',
      description: 'Follow a roadmap',
      icon: Map,
      href: '/roadmap',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Aptitude Test',
      description: 'Test your skills',
      icon: FileText,
      href: '/aptitude',
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      title: 'Code Compiler',
      description: 'Write and test code',
      icon: Zap,
      href: '/compiler',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump to your favorite sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-accent"
                >
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
