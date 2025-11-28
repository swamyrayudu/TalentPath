// API endpoint to fetch DSA stats directly from visible_problems table
// Used by the DSA sheet page for displaying topic statistics

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visibleProblems } from '@/lib/db/schema';
import { eq, or, isNull } from 'drizzle-orm';

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterPlatform = searchParams.get('platform')?.toUpperCase();
    const filterDifficulty = searchParams.get('difficulty')?.toUpperCase();

    console.log(`Fetching stats - Platform: ${filterPlatform || 'ALL'}, Difficulty: ${filterDifficulty || 'ALL'}`);

    // First, get all visible problems
    const allProblems = await db
      .select({
        id: visibleProblems.id,
        platform: visibleProblems.platform,
        difficulty: visibleProblems.difficulty,
        topicSlugs: visibleProblems.topicSlugs,
        likes: visibleProblems.likes,
        acceptanceRate: visibleProblems.acceptanceRate,
      })
      .from(visibleProblems)
      .where(
        or(
          eq(visibleProblems.isVisibleToUsers, true),
          isNull(visibleProblems.isVisibleToUsers)
        )
      );

    console.log(`📦 Total visible problems: ${allProblems.length}`);

    // Process data to extract topics
    const topicMap: Record<string, {
      platform: string;
      difficulty: string;
      topicSlug: string;
      topicName: string;
      totalCount: number;
      totalLikes: number;
      problemIds: Set<number>;
    }> = {};

    const uniqueCounts: Record<string, number> = {};
    const platformTotals: Record<string, number> = {};

    for (const problem of allProblems) {
      const platform = (problem.platform || 'LEETCODE').toUpperCase();
      const difficulty = (problem.difficulty || 'MEDIUM').toUpperCase();
      
      // Filter by platform and difficulty if specified
      if (filterPlatform && platform !== filterPlatform) continue;
      if (filterDifficulty && difficulty !== filterDifficulty) continue;

      // Count unique problems per platform-difficulty
      const countKey = `${platform}-${difficulty}`;
      uniqueCounts[countKey] = (uniqueCounts[countKey] || 0) + 1;
      
      // Count per platform
      platformTotals[platform] = (platformTotals[platform] || 0) + 1;

      // Extract topic slugs from JSONB
      let topicSlugs: string[] = [];
      
      if (problem.topicSlugs) {
        if (Array.isArray(problem.topicSlugs)) {
          topicSlugs = problem.topicSlugs as string[];
        } else if (typeof problem.topicSlugs === 'string') {
          try {
            const parsed = JSON.parse(problem.topicSlugs);
            if (Array.isArray(parsed)) {
              topicSlugs = parsed;
            }
          } catch {
            topicSlugs = [];
          }
        }
      }

      // Process each topic
      for (const topicSlug of topicSlugs) {
        if (!topicSlug || typeof topicSlug !== 'string') continue;
        
        const key = `${platform}-${difficulty}-${topicSlug}`;
        
        if (!topicMap[key]) {
          topicMap[key] = {
            platform,
            difficulty,
            topicSlug,
            topicName: topicSlug
              .split(/[-_]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' '),
            totalCount: 0,
            totalLikes: 0,
            problemIds: new Set(),
          };
        }
        
        // Only count each problem once per topic
        if (!topicMap[key].problemIds.has(problem.id)) {
          topicMap[key].problemIds.add(problem.id);
          topicMap[key].totalCount++;
          topicMap[key].totalLikes += parseInt(problem.likes || '0', 10) || 0;
        }
      }
    }

    // Convert to array format for response
    const stats = Object.values(topicMap)
      .map((item) => {
        const { problemIds, ...rest } = item;
        void problemIds; // Explicitly mark as intentionally unused
        return rest;
      })
      .sort((a, b) => {
        // Sort by platform, then difficulty, then count
        if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
        if (a.difficulty !== b.difficulty) {
          const order = { EASY: 0, MEDIUM: 1, HARD: 2 };
          return (order[a.difficulty as keyof typeof order] || 0) - (order[b.difficulty as keyof typeof order] || 0);
        }
        return b.totalCount - a.totalCount;
      });

    console.log(`Found ${stats.length} topic stats`);

    // Group by platform and difficulty
    const grouped: Record<string, Record<string, typeof stats>> = {};
    const difficultyTotals: Record<string, Record<string, { topics: number; questions: number }>> = {};
    
    for (const stat of stats) {
      if (!grouped[stat.platform]) {
        grouped[stat.platform] = {};
        difficultyTotals[stat.platform] = {};
      }
      if (!grouped[stat.platform][stat.difficulty]) {
        grouped[stat.platform][stat.difficulty] = [];
        difficultyTotals[stat.platform][stat.difficulty] = { topics: 0, questions: 0 };
      }
      
      grouped[stat.platform][stat.difficulty].push(stat);
      difficultyTotals[stat.platform][stat.difficulty].topics++;
      difficultyTotals[stat.platform][stat.difficulty].questions += stat.totalCount;
    }

    // Format unique counts for frontend
    const uniqueCountsArray = Object.entries(uniqueCounts).map(([key, count]) => {
      const [platform, difficulty] = key.split('-');
      return { platform, difficulty, unique_count: count };
    });

    // Format platform totals for frontend
    const platformTotalsArray = Object.entries(platformTotals).map(([platform, total_count]) => ({
      platform,
      total_count,
    }));

    const summary = {
      totalTopics: stats.length,
      totalQuestions: stats.reduce((sum, s) => sum + s.totalCount, 0),
      platforms: Object.keys(grouped),
      difficultyTotals,
    };

    console.log('📈 Summary:', JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      data: stats,
      grouped,
      summary,
      uniqueCounts: uniqueCountsArray,
      platformTotals: platformTotalsArray,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching visible problems stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
