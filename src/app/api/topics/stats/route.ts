import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problems, users } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * GET /api/topics/stats
 * Get topic statistics grouped by difficulty
 * Optimized for DSA sheet rendering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty'); // Optional filter
    const platform = searchParams.get('platform'); // Optional platform filter (LEETCODE, GEEKSFORGEEKS, etc.)
    const bypassVisibility = searchParams.get('bypassVisibility') === 'true';

    console.log('📊 Fetching topic stats...', { difficulty, platform, bypassVisibility });
    const startTime = Date.now();

    // Check if user is admin
    const session = await auth();
    let isAdmin = false;

    if (session?.user?.id) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      isAdmin = user[0]?.role === 'admin';
    }

    // Visibility filter
    const visibilityCondition =
      !isAdmin && !bypassVisibility
        ? sql`AND is_visible_to_users = true`
        : sql``;

    // Difficulty filter
    const difficultyCondition = difficulty
      ? sql`AND difficulty = ${difficulty.toUpperCase()}`
      : sql``;

    // Platform filter
    const platformCondition = platform
      ? sql`AND platform = ${platform.toUpperCase()}`
      : sql``;

    // Optimized query to get topic counts by difficulty and platform
    const result = await db.execute<{
      topic: string;
      topic_slug: string;
      difficulty: string;
      total: string;
    }>(sql`
      SELECT 
        TRIM(topic) as topic,
        TRIM(topic_slug) as topic_slug,
        p.difficulty,
        COUNT(DISTINCT p.id) as total
      FROM 
        ${problems} p,
        unnest(p.topic_tags) as topic,
        unnest(p.topic_slugs) as topic_slug
      WHERE 
        TRIM(topic) != ''
        ${visibilityCondition}
        ${difficultyCondition}
        ${platformCondition}
      GROUP BY 
        TRIM(topic), TRIM(topic_slug), p.difficulty
      ORDER BY 
        p.difficulty, total DESC
    `);

    // Group by difficulty and topic
    const statsByDifficulty: {
      [key: string]: {
        [topicSlug: string]: {
          name: string;
          slug: string;
          total: number;
        };
      };
    } = {
      EASY: {},
      MEDIUM: {},
      HARD: {},
    };

    Array.from(result).forEach((row) => {
      const diff = row.difficulty;
      const topicSlug = row.topic_slug;

      if (!statsByDifficulty[diff]) {
        statsByDifficulty[diff] = {};
      }

      if (!statsByDifficulty[diff][topicSlug]) {
        statsByDifficulty[diff][topicSlug] = {
          name: row.topic,
          slug: topicSlug,
          total: 0,
        };
      }

      statsByDifficulty[diff][topicSlug].total += parseInt(row.total, 10);
    });

    const endTime = Date.now();
    console.log(`✅ Retrieved topic stats in ${endTime - startTime}ms`);

    return NextResponse.json(
      {
        success: true,
        data: statsByDifficulty,
        isAdmin,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching topic stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch topic stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
