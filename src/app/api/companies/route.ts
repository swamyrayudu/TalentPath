import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problems, users } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // Cache for 10 minutes

/**
 * GET /api/companies
 * Returns a paginated list of unique companies with problem counts
 * Supports search, pagination, and efficient queries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    console.log('📊 Fetching companies list...', { limit, offset, search });
    const startTime = Date.now();

    // Check if user is admin
    const session = await auth();
    let isAdmin = false;
    
    if (session?.user?.id) {
      const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
      isAdmin = user[0]?.role === 'admin';
    }

    // Build WHERE clause for search and visibility
    const searchCondition = search 
      ? sql`AND LOWER(TRIM(company)) LIKE LOWER(${'%' + search + '%'})`
      : sql``;
    
    // Add visibility filter for non-admin users
    const visibilityCondition = !isAdmin 
      ? sql`AND is_visible_to_users = true`
      : sql``;

    // Get total count for pagination
    const countResult = await db.execute<{ total: string }>(sql`
      SELECT COUNT(DISTINCT TRIM(company)) as total
      FROM ${problems},
           unnest(company_tags) as company
      WHERE TRIM(company) != ''
      ${visibilityCondition}
      ${searchCondition}
    `);

    const total = parseInt(Array.from(countResult)[0]?.total || '0', 10);

    // Use SQL to efficiently extract and count company tags with pagination
    const result = await db.execute<{ name: string; count: string }>(sql`
      SELECT 
        TRIM(company) as name,
        COUNT(DISTINCT id) as count
      FROM 
        ${problems},
        unnest(company_tags) as company
      WHERE 
        TRIM(company) != ''
        ${visibilityCondition}
        ${searchCondition}
      GROUP BY 
        TRIM(company)
      ORDER BY 
        count DESC, name ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const companies = Array.from(result).map((row) => ({
      name: row.name,
      count: parseInt(row.count, 10),
    }));

    const endTime = Date.now();
    console.log(`✅ Retrieved ${companies.length}/${total} companies in ${endTime - startTime}ms`);

    return NextResponse.json({
      success: true,
      data: companies,
      count: companies.length,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch companies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
