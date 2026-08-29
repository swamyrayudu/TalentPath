'use server';

import { db } from '@/lib/db';
import { dailyChallengeCompletions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { invalidateDashboardCache } from '@/lib/redis';
import {
  getOrCreateDailyChallenge,
  getDailyStreak,
  todayKey,
} from '@/lib/daily-challenge';

interface ToggleResult {
  success: boolean;
  error?: string;
  solvedToday?: boolean;
  streak?: number;
  longest?: number;
  completedThisMonth?: number;
}

/**
 * Marks today's daily problem solved, or un-marks it. Only today can be
 * toggled — back-filling old days would make the streak meaningless.
 */
export async function toggleDailyCompletion(): Promise<ToggleResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: 'You need to be signed in to track the daily problem.' };
  }

  const dateKey = todayKey();

  try {
    const challenge = await getOrCreateDailyChallenge(dateKey);
    if (!challenge) {
      return { success: false, error: 'No daily problem is available right now.' };
    }

    const [existing] = await db
      .select({ id: dailyChallengeCompletions.id })
      .from(dailyChallengeCompletions)
      .where(
        and(
          eq(dailyChallengeCompletions.userId, userId),
          eq(dailyChallengeCompletions.challengeDate, dateKey)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(dailyChallengeCompletions)
        .where(eq(dailyChallengeCompletions.id, existing.id));
    } else {
      await db
        .insert(dailyChallengeCompletions)
        .values({
          userId,
          challengeDate: dateKey,
          problemId: challenge.problemId,
        })
        .onConflictDoNothing();
    }

    // Suggestions re-key off the profile fingerprint, so only this cache needs clearing.
    await invalidateDashboardCache(userId);

    const streak = await getDailyStreak(userId);
    revalidatePath('/dashboard');

    return {
      success: true,
      solvedToday: streak.solvedToday,
      streak: streak.current,
      longest: streak.longest,
      completedThisMonth: streak.completedThisMonth,
    };
  } catch (error) {
    console.error('[DailyChallenge] Toggle failed:', error);
    return { success: false, error: 'Could not update the daily problem. Try again.' };
  }
}
