'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Code2, 
  Network, 
  MessageSquare, 
  Building2,
  Clock,
  Target,
  TrendingUp,
  Play,
  History,
  Award,
  ChevronRight
} from 'lucide-react';

interface InterviewType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  color: string;
}

const interviewTypes: InterviewType[] = [
  {
    id: 'dsa-coding',
    title: 'DSA & Coding Interview',
    description: 'Practice data structures and algorithms with AI interviewer',
    icon: <Code2 className="h-6 w-6" />,
    duration: '30-45 mins',
    difficulty: 'intermediate',
    topics: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'System Design Basics'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'system-design',
    title: 'System Design Interview',
    description: 'Design scalable systems with AI guidance and feedback',
    icon: <Network className="h-6 w-6" />,
    duration: '45-60 mins',
    difficulty: 'advanced',
    topics: ['Scalability', 'Load Balancing', 'Databases', 'Caching', 'Microservices'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'behavioral',
    title: 'Behavioral Interview',
    description: 'Practice behavioral questions and get instant feedback',
    icon: <MessageSquare className="h-6 w-6" />,
    duration: '20-30 mins',
    difficulty: 'beginner',
    topics: ['Leadership', 'Teamwork', 'Conflict Resolution', 'Problem Solving'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'company-specific',
    title: 'Company-Specific Mock',
    description: 'Tailored interviews for FAANG and top tech companies',
    icon: <Building2 className="h-6 w-6" />,
    duration: '60+ mins',
    difficulty: 'advanced',
    topics: ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple'],
    color: 'from-orange-500 to-red-500',
  },
];

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-700 dark:text-green-400',
  intermediate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access AI Mock Interviews
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartInterview = (typeId: string) => {
    router.push(`/interview/${typeId}/configure`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Mock Interviews</h1>
              <p className="text-muted-foreground">
                Practice with AI-powered interviews and get instant feedback
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviews Done</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">0h</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Improvement</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Choose Interview Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviewTypes.map((type) => (
              <Card 
                key={type.id} 
                className="hover:shadow-lg transition-shadow group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${type.color}`}>
                      <div className="text-white">{type.icon}</div>
                    </div>
                    <Badge className={difficultyColors[type.difficulty]}>
                      {type.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{type.duration}</span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Topics Covered:</p>
                      <div className="flex flex-wrap gap-2">
                        {type.topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full group-hover:bg-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartInterview(type.id);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Interview
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Interviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Interviews</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/interview/history">
                View All
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No interviews yet</p>
              <p className="text-sm text-muted-foreground">
                Start your first mock interview to track your progress
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
