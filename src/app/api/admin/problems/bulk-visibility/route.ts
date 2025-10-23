import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { problems, users } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/problems/bulk-visibility
 * Bulk update visibility for problems by filters (topic, difficulty, company, platform)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user[0]?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      action,
      filters = {},
      problemIds,
    } = body;

    if (!action || (action !== 'show' && action !== 'hide')) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "show" or "hide"' },
        { status: 400 }
      );
    }

    const isVisible = action === 'show';
    console.log(`📝 Bulk ${action} visibility`, { filters, problemIds: problemIds?.length });

    let result;

    // If specific problem IDs are provided
    if (problemIds && Array.isArray(problemIds) && problemIds.length > 0) {
      result = await db
        .update(problems)
        .set({ isVisibleToUsers: isVisible, updatedAt: new Date() })
        .where(inArray(problems.id, problemIds))
        .returning({ id: problems.id });

      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'show' ? 'showed' : 'hidden'} ${result.length} problem(s)`,
        updated: result.length,
      });
    }

    // Build conditions based on filters
    const conditions = [];

    if (filters.difficulty) {
      conditions.push(eq(problems.difficulty, filters.difficulty.toUpperCase()));
    }

    if (filters.platform) {
      conditions.push(eq(problems.platform, filters.platform.toUpperCase()));
    }

    if (filters.topic) {
      const topicSlug = filters.topic.toLowerCase().replace(/\s+/g, '-');
      conditions.push(
        sql`(
          EXISTS (
            SELECT 1 FROM unnest(${problems.topicTags}) AS tag 
            WHERE LOWER(tag) = LOWER(${filters.topic})
          )
          OR ${problems.topicSlugs} && ARRAY[${topicSlug}]
        )`
      );
    }

    if (filters.company) {
      const companyName = decodeURIComponent(filters.company).replace(/-/g, ' ');
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM unnest(${problems.companyTags}) AS tag 
          WHERE LOWER(tag) = LOWER(${companyName})
        )`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    if (!whereClause) {
      return NextResponse.json(
        { success: false, error: 'No valid filters provided' },
        { status: 400 }
      );
    }

    // Update matching problems
    result = await db
      .update(problems)
      .set({ isVisibleToUsers: isVisible, updatedAt: new Date() })
      .where(whereClause)
      .returning({ id: problems.id });

    console.log(`✅ Updated ${result.length} problems`);

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'show' ? 'showed' : 'hidden'} ${result.length} problem(s) matching the filters`,
      updated: result.length,
      filters,
    });
  } catch (error) {
    console.error('❌ Error bulk updating visibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to bulk update visibility',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/problems/bulk-visibility
 * Get visibility statistics
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user[0]?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get visibility stats
    const stats = await db.execute<{
      difficulty: string;
      platform: string;
      total: string;
      visible: string;
      hidden: string;
    }>(sql`
      SELECT 
        difficulty,
        platform,
        COUNT(*) as total,
        SUM(CASE WHEN is_visible_to_users = true THEN 1 ELSE 0 END) as visible,
        SUM(CASE WHEN is_visible_to_users = false THEN 1 ELSE 0 END) as hidden
      FROM ${problems}
      GROUP BY difficulty, platform
      ORDER BY difficulty, platform
    `);

    const result = Array.from(stats).map((row) => ({
      difficulty: row.difficulty,
      platform: row.platform,
      total: parseInt(row.total, 10),
      visible: parseInt(row.visible, 10),
      hidden: parseInt(row.hidden, 10),
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error fetching visibility stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visibility stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
