import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // Cache for 10 minutes

/**
 * GET /api/companies/[company]/topics
 * Returns all topics/tags for a specific company with problem counts
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

    console.log('📊 Fetching topics for company:', companyName, 'platform:', platform);
    const startTime = Date.now();

    const platformCondition = platform
      ? sql`AND np.platform = ${platform}`
      : sql``;

    // ✅ Efficient SQL to get unique topics and counts
    const result = await db.execute<{ topic: string; count: string }>(sql`
      WITH normalized_problems AS (
        SELECT
          p.id,
          p.platform,
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
        TRIM(topic_values.topic)
      ORDER BY 
        count DESC, topic ASC
    `);

    const topics = Array.from(result).map((row) => ({
      name: row.topic,
      count: parseInt(row.count, 10),
    }));

    const endTime = Date.now();
    console.log(`✅ Retrieved ${topics.length} topics for ${companyName} in ${endTime - startTime}ms`);

    return NextResponse.json(
      {
        success: true,
        data: topics,
        company: companyName,
        count: topics.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching company topics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company topics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
