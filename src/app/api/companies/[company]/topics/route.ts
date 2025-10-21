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
  request: Request,
  { params }: { params: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = params.company;
    const companyName = companySlug.replace(/-/g, ' ');
    const platform = searchParams.get('platform');

    console.log('📊 Fetching topics for company:', companyName, 'platform:', platform);
    const startTime = Date.now();

    // ✅ Check if user is admin
    const session = await auth();
    let isAdmin = false;
    if (session?.user?.id) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      isAdmin = user[0]?.role === 'admin';
      console.log('👤 User role:', isAdmin ? 'ADMIN' : 'USER');
    } else {
      console.log('👥 Unauthenticated - treated as non-admin');
    }

    // ✅ Apply approval + visibility filter
    const approvalCondition = !isAdmin
      ? sql`AND p.is_approved = true AND p.is_visible_to_users = true`
      : sql``;

    const platformCondition = platform
      ? sql`AND p.platform = ${platform}`
      : sql``;

    // ✅ Efficient SQL to get unique topics and counts
    const result = await db.execute<{ topic: string; count: string }>(sql`
      SELECT 
        TRIM(topic) AS topic,
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
        ${approvalCondition}
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
