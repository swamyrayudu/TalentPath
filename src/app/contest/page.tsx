import React from 'react';

import { getContests } from '@/actions/contest.actions';
import { ContestCard } from '@/components/contest/contest-card';
import { CreateContestDialog } from '@/components/contest/create-contest-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, LogIn } from 'lucide-react';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContestsPage() {
  const session = await auth();
  const contestsResult = await getContests();
  const contests = contestsResult.success && contestsResult.data ? contestsResult.data : [];

  const liveCount = contests.filter((c) => c.status === 'live').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Coding contests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {liveCount > 0
                ? `${liveCount} contest${liveCount === 1 ? '' : 's'} running right now.`
                : 'Timed challenges against real opponents. Solve under pressure.'}
            </p>
          </div>

          {session?.user ? (
            <CreateContestDialog>
              <Button className="gap-2">
                <Plus className="size-4" />
                Create contest
              </Button>
            </CreateContestDialog>
          ) : (
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/api/auth/signin">
                <LogIn className="size-4" />
                Sign in to create
              </Link>
            </Button>
          )}
        </div>

        {/* ── Contests ───────────────────────────────────────────── */}
        {contests.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Trophy className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h2 className="mt-4 text-sm font-semibold tracking-tight">
              No contests yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Be the first to create one and challenge the community.
            </p>
            <div className="mt-5">
              {session?.user ? (
                <CreateContestDialog>
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    Create the first contest
                  </Button>
                </CreateContestDialog>
              ) : (
                <Button variant="outline" className="gap-2" asChild>
                  <Link href="/api/auth/signin">
                    <LogIn className="size-4" />
                    Sign in to create
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
