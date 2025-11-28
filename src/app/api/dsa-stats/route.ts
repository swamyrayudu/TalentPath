// Optimized API endpoint for DSA topic statistics
// Fetches from pre-calculated dsa_topic_stats table (built from visible_problems only)
// Used by /dsasheet page for fast loading

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaTopicStats } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty')?.toUpperCase();
    const platform = searchParams.get('platform')?.toUpperCase();

    // Validate difficulty
    if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty. Must be EASY, MEDIUM, or HARD' },
        { status: 400 }
      );
    }

    // Validate platform
    if (platform && !['LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const filters = [];
    if (difficulty) {
      filters.push(eq(dsaTopicStats.difficulty, difficulty as 'EASY' | 'MEDIUM' | 'HARD'));
    }
    if (platform) {
      filters.push(eq(dsaTopicStats.platform, platform as 'LEETCODE' | 'GEEKSFORGEEKS' | 'CODEFORCES' | 'HACKERRANK'));
    }

    const stats = await db
      .select({
        difficulty: dsaTopicStats.difficulty,
        platform: dsaTopicStats.platform,
        topicSlug: dsaTopicStats.topicSlug,
        topicName: dsaTopicStats.topicName,
        totalCount: dsaTopicStats.totalCount,
      })
      .from(dsaTopicStats)
      .where(filters.length ? and(...filters) : undefined);

    // Calculate unique problem counts per platform/difficulty
    const uniqueCounts = await db.execute(sql`
      SELECT 
        platform,
        difficulty,
        COUNT(DISTINCT id) as unique_count
      FROM visible_problems
      GROUP BY platform, difficulty
    `);

    // Return flat array with unique counts - let frontend organize by platform/difficulty
    return NextResponse.json({
      success: true,
      data: stats,
      uniqueCounts: uniqueCounts,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching DSA topic stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch topic statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint to manually refresh stats (admin only)
export async function POST() {
  try {
    // TODO: Add admin authentication check here
    
    // Sync visible problems and refresh stats
    await db.execute(sql.raw('SELECT sync_visible_problems()'));
    await db.execute(sql.raw('SELECT refresh_dsa_topic_stats()'));
    
    return NextResponse.json({
      success: true,
      message: 'Visible problems synced and statistics refreshed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing DSA topic stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh topic statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
