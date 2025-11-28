'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
  History,
  Award,
  ChevronRight,
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

const difficultyColors: Record<InterviewType['difficulty'], string> = {
  beginner: 'bg-green-500/10 text-green-200',
  intermediate: 'bg-yellow-500/10 text-yellow-200',
  advanced: 'bg-red-500/10 text-red-200',
};

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">Sign In Required</h2>
            <p className="mb-6 text-muted-foreground">Please sign in to access AI Mock Interviews</p>
            <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartInterview = (typeId: string) => {
    router.push(`/interview/${typeId}/configure`);
  };

  const stats = [
    { label: 'Interviews Done', value: '0', icon: <History className="h-5 w-5" /> },
    { label: 'Avg Score', value: '--', icon: <Target className="h-5 w-5" /> },
    { label: 'Total Time', value: '0h', icon: <Clock className="h-5 w-5" /> },
    { label: 'Improvement', value: '--', icon: <TrendingUp className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a0f17] via-[#120b11] to-[#060406] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                <Brain className="h-3 w-3" />
                AI Mock Suite
              </div>
              <div>
                <h1 className="text-3xl font-bold md:text-4xl">AI Mock Interviews</h1>
                <p className="mt-2 text-sm text-white/70">
                  Compete with yourself, stay sharp, and get instant feedback with real-time AI interviewers.
                </p>
              </div>
            </div>
            <Button
              className="h-11 w-full rounded-full bg-gradient-to-r from-[#ff4d4f] to-[#ff7a45] text-white shadow-amber-500/20 transition hover:brightness-110 md:w-auto"
              onClick={() => handleStartInterview('dsa-coding')}
            >
              + Start New Interview
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur ${index === 0 ? 'ring-1 ring-red-500/30' : ''}`}
              >
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{stat.label}</span>
                  <span className="text-white/60">{stat.icon}</span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm text-white/60">Choose your next challenge</p>
            <h2 className="text-2xl font-semibold text-white">Interview Modes</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {interviewTypes.map((type) => (
              <div
                key={type.id}
                className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d0f] p-6 shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-red-500/40"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-2xl p-3 text-white bg-gradient-to-br ${type.color}`}>
                    {type.icon}
                  </div>
                  <Badge className={`rounded-full px-3 py-1 text-xs capitalize ${difficultyColors[type.difficulty]}`}>
                    {type.difficulty}
                  </Badge>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{type.title}</h3>
                <p className="text-sm text-white/60">{type.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                  <Clock className="h-4 w-4" />
                  {type.duration}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {type.topics.map((topic) => (
                    <span key={topic} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                      {topic}
                    </span>
                  ))}
                </div>
                <Button
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#ff4d4f] to-[#ff7a45] text-sm font-semibold shadow-lg shadow-red-500/30 hover:brightness-110"
                  onClick={() => handleStartInterview(type.id)}
                >
                  Start Interview
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Recent Interviews</h2>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/interview/history" className="flex items-center gap-2">
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b0b0d] p-10 text-center text-white/60">
            <Award className="mx-auto mb-4 h-12 w-12 text-white/30" />
            <p className="text-base font-medium text-white">No interviews yet</p>
            <p className="mt-1 text-sm text-white/60">
              Start your first mock session to see progress here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
