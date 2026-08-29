'use client';
import React from 'react';
import Link from 'next/link';
import { Crown, ArrowLeft, Zap, Shield, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const perks = [
  {
    icon: InfinityIcon,
    title: 'Unlimited runs',
    body: 'No rate limits on the compiler.',
  },
  {
    icon: Zap,
    title: 'Priority queue',
    body: 'Your submissions run first.',
  },
  {
    icon: Shield,
    title: 'Pro content',
    body: 'Exclusive problem sets.',
  },
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-20 md:px-6">
        <div className="text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Crown className="size-5" strokeWidth={1.75} />
          </span>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Coming soon
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            TalentPath Premium
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Unlimited compilations, priority execution, and content you won&apos;t find
            on the free tier.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {perks.map((perk) => (
            <div key={perk.title} className="rounded-2xl border bg-card p-5 text-center">
              <perk.icon
                className="mx-auto size-[18px] text-muted-foreground"
                strokeWidth={1.75}
              />
              <p className="mt-3 text-sm font-medium">{perk.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{perk.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/compiler">
              <ArrowLeft className="size-4" />
              Back to compiler
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
