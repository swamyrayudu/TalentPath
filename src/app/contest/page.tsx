import React from 'react';

import { getContests } from '@/actions/contest.actions';
import { ContestCard } from '@/components/contest/contest-card';
import { CreateContestDialog } from '@/components/contest/create-contest-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, LogIn, Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContestsPage() {
  const session = await auth();
  const contestsResult = await getContests();
  const contests = contestsResult.success && contestsResult.data ? contestsResult.data : [];

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 leading-tight">
                Coding Contests
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Compete, learn, and improve your skills</span>
              </p>
            </div>
          </div>

          {session?.user ? (
            <CreateContestDialog>
              <Button size="default" className="w-full md:w-auto hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/50 text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Create Contest
              </Button>
            </CreateContestDialog>
          ) : (
            <Link href="/api/auth/signin" className="w-full md:w-auto">
              <Button size="default" variant="outline" className="w-full hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300 text-sm sm:text-base">
                <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Login to Create
              </Button>
            </Link>
          )}
        </div>
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex p-6 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <Trophy className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Contests Available</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Be the first to create a contest and challenge the community!
          </p>
          {session?.user ? (
            <CreateContestDialog>
              <Button size="lg" className="hover:bg-primary/90 transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                Create First Contest
              </Button>
            </CreateContestDialog>
          ) : (
            <Link href="/api/auth/signin">
              <Button size="lg" variant="outline" className="hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300">
                <LogIn className="h-5 w-5 mr-2" />
                Login to Create Contest
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}
