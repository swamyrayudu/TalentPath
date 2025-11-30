import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
      ? sql`AND np.platform = ${platform}`
      : sql``;

    // Single optimized query to get all topic stats
    const result = await db.execute<{ 
      topic: string; 
      count: string;
      difficulty: string;
      platform: string;
    }>(sql`
      WITH normalized_problems AS (
        SELECT
          p.id,
          p.platform,
          p.difficulty,
          CASE
            WHEN p.topic_tags IS NULL THEN '[]'::jsonb
            WHEN jsonb_typeof(p.topic_tags) = 'array' THEN p.topic_tags
            WHEN jsonb_typeof(p.topic_tags) = 'string' AND (p.topic_tags #>> '{}') LIKE '[%' THEN
              COALESCE(NULLIF(BTRIM(p.topic_tags #>> '{}'), '')::jsonb, '[]'::jsonb)
            WHEN jsonb_typeof(p.topic_tags) = 'string' THEN jsonb_build_array(p.topic_tags #>> '{}')
            ELSE '[]'::jsonb
          END AS normalized_topic_tags,
          CASE
            WHEN p.company_tags IS NULL THEN '[]'::jsonb
            WHEN jsonb_typeof(p.company_tags) = 'array' THEN p.company_tags
            WHEN jsonb_typeof(p.company_tags) = 'string' AND (p.company_tags #>> '{}') LIKE '[%' THEN
              COALESCE(NULLIF(BTRIM(p.company_tags #>> '{}'), '')::jsonb, '[]'::jsonb)
            WHEN jsonb_typeof(p.company_tags) = 'string' THEN jsonb_build_array(p.company_tags #>> '{}')
            ELSE '[]'::jsonb
          END AS normalized_company_tags
        FROM "problems" p
      )
      SELECT 
        TRIM(topic_values.topic) AS topic,
        np.difficulty,
        np.platform,
        COUNT(DISTINCT np.id) AS count
      FROM 
        normalized_problems np
      CROSS JOIN LATERAL jsonb_array_elements_text(np.normalized_topic_tags) AS topic_values(topic)
      WHERE 
        TRIM(topic_values.topic) != ''
        AND EXISTS (
          SELECT 1 
          FROM jsonb_array_elements_text(np.normalized_company_tags) AS company_values(company)
          WHERE LOWER(TRIM(company_values.company)) = LOWER(${companyName})
        )
        ${platformCondition}
      GROUP BY 
        TRIM(topic_values.topic), np.difficulty, np.platform
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
