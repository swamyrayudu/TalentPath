import React from 'react';
import { auth } from '@/lib/auth';
import {
  getOrCreateDailyChallenge,
  getDailyStreak,
  emptyStreak,
} from '@/lib/daily-challenge';
import { DailyProblemCard } from '@/components/dsa/daily-problem-card';
import { SheetBrowser } from '@/components/dsa/sheet-browser';

export default async function DSASheetPage() {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  const [problem, streak] = await Promise.all([
    getOrCreateDailyChallenge().catch(error => {
      console.error('[DSA Sheet] Daily problem unavailable:', error);
      return null;
    }),
    userId
      ? getDailyStreak(userId).catch(error => {
          console.error('[DSA Sheet] Daily streak unavailable:', error);
          return emptyStreak();
        })
      : Promise.resolve(emptyStreak()),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <SheetBrowser
          daily={
            <DailyProblemCard
              problem={problem}
              streak={streak}
              isSignedIn={Boolean(userId)}
            />
          }
        />
      </div>
    </div>
  );
}
