import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problems } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // Cache for 10 minutes

/**
 * GET /api/companies/[company]/topics
 * Returns all topics/tags for a specific company with problem counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { company: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = params.company;
    const companyName = companySlug.replace(/-/g, ' ');
    const platform = searchParams.get('platform');
    
    console.log('📊 Fetching topics for company:', companyName, 'platform:', platform);
    const startTime = Date.now();

    // Build platform condition - platform is required now
    const platformCondition = platform
      ? sql`AND p.platform = ${platform}`
      : sql``;

    // Get all unique topics for this company with problem counts
    const result = await db.execute<{ topic: string; count: string }>(sql`
      SELECT 
        TRIM(topic) as topic,
        COUNT(DISTINCT p.id) as count
      FROM 
        ${problems} p,
        unnest(p.topic_tags) as topic
      WHERE 
        EXISTS (
          SELECT 1 
          FROM unnest(p.company_tags) AS company_tag 
          WHERE LOWER(TRIM(company_tag)) = LOWER(${companyName})
        )
        AND TRIM(topic) != ''
        ${platformCondition}
      GROUP BY 
        TRIM(topic)
      ORDER BY 
        count DESC, topic ASC
    `);

    const topics = Array.from(result).map((row) => ({
      name: row.topic,
      count: parseInt(row.count, 10),
    }));

    const endTime = Date.now();
    console.log(`✅ Retrieved ${topics.length} topics for ${companyName} in ${endTime - startTime}ms`);

    return NextResponse.json({
      success: true,
      data: topics,
      company: companyName,
      count: topics.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
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
