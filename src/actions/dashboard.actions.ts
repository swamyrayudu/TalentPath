'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { aptitudeResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserContestStats } from '@/actions/contest.actions';

export interface ContestTabData {
  totalSubmissions: number;
  totalAccepted: number;
  uniqueProblemsSolved: number;
  questionStats: Array<{
    questionId: string;
    questionTitle: string;
    totalSubmissions: number;
    acceptedSubmissions: number;
    lastSubmittedAt: Date | string | null;
  }>;
  recentSubmissions: Array<{
    id: string;
    contestId: string;
    questionId: string;
    questionTitle: string | null;
    verdict: string;
    score: number | null;
    submittedAt: Date | string;
  }>;
}

export interface AptitudeTabData {
  totalTests: number;
  averageScore: number;
  bestScore: number;
  topicStats: Array<{
    topic: string;
    testsCompleted: number;
    averageScore: number;
    bestScore: number;
  }>;
  recentTests: Array<{
    id: string | number;
    topic: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: Date | string;
  }>;
}

/**
 * On-demand action: fetches Contest statistics only when the Contest tab is clicked.
 */
export async function getContestTabStatsAction(): Promise<{
  success: boolean;
  data?: ContestTabData;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const contestStatsResult = await getUserContestStats(userId);
    if (!contestStatsResult.success || !contestStatsResult.data) {
      return {
        success: true,
        data: {
          totalSubmissions: 0,
          totalAccepted: 0,
          uniqueProblemsSolved: 0,
          questionStats: [],
          recentSubmissions: [],
        },
      };
    }

    return {
      success: true,
      data: contestStatsResult.data,
    };
  } catch (error) {
    console.error('[Dashboard Actions] Contest stats error:', error);
    return { success: false, error: 'Failed to fetch contest statistics.' };
  }
}

/**
 * On-demand action: fetches Aptitude statistics only when the Tests tab is clicked.
 */
export async function getAptitudeTabStatsAction(): Promise<{
  success: boolean;
  data?: AptitudeTabData;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const aptitudeResult = await db
      .select()
      .from(aptitudeResults)
      .where(eq(aptitudeResults.userId, userId))
      .orderBy(desc(aptitudeResults.completedAt));

    const totalTests = aptitudeResult.length;
    const averageScore =
      totalTests > 0
        ? Math.round(aptitudeResult.reduce((sum, r) => sum + r.score, 0) / totalTests)
        : 0;
    const bestScore = totalTests > 0 ? Math.max(...aptitudeResult.map(r => r.score)) : 0;

    const topicMap = new Map<string, { total: number; count: number; best: number }>();
    aptitudeResult.forEach(result => {
      const existing = topicMap.get(result.topic) || { total: 0, count: 0, best: 0 };
      topicMap.set(result.topic, {
        total: existing.total + result.score,
        count: existing.count + 1,
        best: Math.max(existing.best, result.score),
      });
    });

    const topicStats = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        testsCompleted: data.count,
        averageScore: Math.round(data.total / data.count),
        bestScore: data.best,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    const recentTests = aptitudeResult.slice(0, 10).map(r => ({
      id: r.id,
      topic: r.topic,
      score: r.score,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
      completedAt: r.completedAt,
    }));

    return {
      success: true,
      data: {
        totalTests,
        averageScore,
        bestScore,
        topicStats,
        recentTests,
      },
    };
  } catch (error) {
    console.error('[Dashboard Actions] Aptitude stats error:', error);
    return { success: false, error: 'Failed to fetch aptitude statistics.' };
  }
}
