import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

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

    // Build WHERE clause for search
    const searchValue = search ? `%${search.trim()}%` : null;
    const searchCondition = searchValue
      ? sql`AND LOWER(TRIM(company)) LIKE LOWER(${searchValue})`
      : sql``;

    const companySource = sql`
      WITH normalized_problems AS (
        SELECT
          p.id,
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
        np.id,
        TRIM(company) as company
      FROM normalized_problems np
      CROSS JOIN LATERAL (
        SELECT jsonb_array_elements_text(np.normalized_company_tags) AS company
      ) extracted
      WHERE TRIM(company) != ''
      ${searchCondition}
    `;

    // Get total count for pagination
    const countResult = await db.execute<{ total: string }>(sql`
      SELECT COUNT(*) as total
      FROM (${companySource}) company_list
    `);

    const total = parseInt(Array.from(countResult)[0]?.total || '0', 10);

    // Use SQL to efficiently extract and count company tags with pagination
    const result = await db.execute<{ name: string; count: string }>(sql`
      SELECT 
        company as name,
        COUNT(DISTINCT id) as count
      FROM 
        (${companySource}) companies
      GROUP BY 
        company
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
