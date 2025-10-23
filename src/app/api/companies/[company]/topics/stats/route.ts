import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problems } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * GET /api/companies/[company]/topics/stats
 * Get topic statistics for a company with counts
 * Optimized for faster loading
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ company: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { company } = await params;
    const companySlug = company;
    const companyName = companySlug.replace(/-/g, ' ');
    const platform = searchParams.get('platform');

    console.log('📊 Fetching optimized topic stats for company:', companyName, 'platform:', platform);
    const startTime = Date.now();

    const platformCondition = platform
      ? sql`AND p.platform = ${platform}`
      : sql``;

    // Single optimized query to get all topic stats
    const result = await db.execute<{ 
      topic: string; 
      count: string;
      difficulty: string;
      platform: string;
    }>(sql`
      SELECT 
        TRIM(topic) AS topic,
        p.difficulty,
        p.platform,
        COUNT(DISTINCT p.id) AS count
      FROM 
        ${problems} p,
        UNNEST(p.topic_tags) AS topic
      WHERE 
        EXISTS (
          SELECT 1 
          FROM UNNEST(p.company_tags) AS company_tag 
          WHERE LOWER(TRIM(company_tag)) = LOWER(${companyName})
        )
        AND TRIM(topic) != ''
        ${platformCondition}
      GROUP BY 
        TRIM(topic), p.difficulty, p.platform
      ORDER BY 
        count DESC
    `);

    // Process results into structured format
    const topicsMap = new Map<string, {
      name: string;
      totalCount: number;
      byDifficulty: { [key: string]: number };
      byPlatform: { [key: string]: number };
    }>();

    Array.from(result).forEach((row) => {
      const topicName = row.topic;
      const count = parseInt(row.count, 10);

      if (!topicsMap.has(topicName)) {
        topicsMap.set(topicName, {
          name: topicName,
          totalCount: 0,
          byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
          byPlatform: {},
        });
      }

      const topic = topicsMap.get(topicName)!;
      topic.totalCount += count;
      topic.byDifficulty[row.difficulty] = (topic.byDifficulty[row.difficulty] || 0) + count;
      topic.byPlatform[row.platform] = (topic.byPlatform[row.platform] || 0) + count;
    });

    // Convert to array and sort by total count
    const topics = Array.from(topicsMap.values()).sort(
      (a, b) => b.totalCount - a.totalCount
    );

    const endTime = Date.now();
    console.log(`✅ Retrieved ${topics.length} topics with stats for ${companyName} in ${endTime - startTime}ms`);

    return NextResponse.json(
      {
        success: true,
        data: topics,
        company: companyName,
        count: topics.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching company topic stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company topic stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
