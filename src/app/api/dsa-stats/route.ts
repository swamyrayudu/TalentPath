// Optimized API endpoint for DSA topic statistics
// Fetches from pre-calculated dsa_topic_stats table (built from visible_problems only)
// Used by /dsasheet page for fast loading

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaTopicStats } from '@/lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';

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

    // Build query conditions
    const conditions = [];
    if (difficulty) {
      conditions.push(eq(dsaTopicStats.difficulty, difficulty as 'EASY' | 'MEDIUM' | 'HARD'));
    }
    if (platform) {
      conditions.push(eq(dsaTopicStats.platform, platform as 'LEETCODE' | 'GEEKSFORGEEKS' | 'CODEFORCES' | 'HACKERRANK'));
    }

    // Fetch stats from optimized table
    const stats = conditions.length > 0
      ? await db.select().from(dsaTopicStats).where(and(...conditions))
      : await db.select().from(dsaTopicStats);

    // Group by difficulty and topic_slug for easy consumption
    const result: Record<string, Record<string, { total: number; solved: number; name: string }>> = {
      EASY: {},
      MEDIUM: {},
      HARD: {},
    };

    stats.forEach((row) => {
      const diff = row.difficulty;
      const slug = row.topicSlug;
      
      if (!result[diff]) {
        result[diff] = {};
      }
      
      if (!result[diff][slug]) {
        result[diff][slug] = {
          total: 0,
          solved: 0,
          name: row.topicName,
        };
      }
      
      result[diff][slug].total += row.totalCount || 0;
      // Note: solved count comes from user progress, not from this table
      // Client will merge this with user progress data
    });

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
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
