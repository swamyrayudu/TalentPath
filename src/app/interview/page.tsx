'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Code2,
  Network,
  MessageSquare,
  Building2,
  Clock,
  ArrowRight,
  Award,
} from 'lucide-react';

interface InterviewType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
}

const interviewTypes: InterviewType[] = [
  {
    id: 'dsa-coding',
    title: 'DSA & coding',
    description: 'Work through data structures and algorithms with an AI interviewer.',
    icon: Code2,
    duration: '30–45 min',
    difficulty: 'intermediate',
    topics: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming'],
  },
  {
    id: 'system-design',
    title: 'System design',
    description: 'Design a scalable system and defend your trade-offs.',
    icon: Network,
    duration: '45–60 min',
    difficulty: 'advanced',
    topics: ['Scalability', 'Load balancing', 'Databases', 'Caching'],
  },
  {
    id: 'behavioral',
    title: 'Behavioral',
    description: 'Practise the story questions and get feedback on your answers.',
    icon: MessageSquare,
    duration: '20–30 min',
    difficulty: 'beginner',
    topics: ['Leadership', 'Teamwork', 'Conflict', 'Problem solving'],
  },
  {
    id: 'company-specific',
    title: 'Company-specific',
    description: 'Mock rounds shaped around a particular company’s loop.',
    icon: Building2,
    duration: '60+ min',
    difficulty: 'advanced',
    topics: ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple'],
  },
];

const difficultyTone: Record<InterviewType['difficulty'], string> = {
  beginner: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  intermediate: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  advanced: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 py-20 md:px-6">
          <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Brain className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h1 className="mt-4 text-sm font-semibold tracking-tight">Sign in required</h1>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Mock interviews are tied to your account so feedback carries over.
            </p>
            <Button className="mt-5" onClick={() => router.push('/auth/signin')}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartInterview = (typeId: string) => {
    router.push(`/interview/${typeId}/configure`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              AI mock interviews
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Practise under interview conditions and get feedback while it&apos;s fresh.
            </p>
          </div>
          <Button className="gap-2" onClick={() => handleStartInterview('dsa-coding')}>
            Start an interview
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Interviews" value="0" />
          <Stat label="Average score" value="—" />
          <Stat label="Total time" value="0h" />
          <Stat label="Improvement" value="—" />
        </div>

        {/* ── Modes ──────────────────────────────────────────────── */}
        <h2 className="mt-10 text-sm font-semibold tracking-tight">Interview modes</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {interviewTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleStartInterview(type.id)}
              className="group flex flex-col rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <type.icon className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="truncate text-base font-semibold tracking-tight">
                    {type.title}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 capitalize ${difficultyTone[type.difficulty]}`}
                >
                  {type.difficulty}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {type.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {type.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="font-normal">
                    {topic}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" strokeWidth={1.75} />
                  {type.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Start
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* ── History ────────────────────────────────────────────── */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent interviews</h2>
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link href="/interview/history">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-3 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
          <Award className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-semibold tracking-tight">No interviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your first session will show up here.
          </p>
        </div>
      </div>
    </div>
  );
}
