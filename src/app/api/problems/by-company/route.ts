import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems } from '@/lib/db/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * GET /api/problems/by-company
 * Returns company-wise DSA questions with optimized data fetching
 * Supports filtering by:
 * - company: Company name to filter by
 * - difficulty: EASY, MEDIUM, HARD, or 'all'
 * - platform: LEETCODE, GEEKSFORGEEKS, etc.
 * - search: Search in problem titles
 * - limit: Number of problems per page (default: 200)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const company = searchParams.get('company');
    const difficulty = searchParams.get('difficulty');
    const platform = searchParams.get('platform');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'likes';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!company || company === 'all' || company === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Company parameter is required and must be valid' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching company-wise problems:', {
      company,
      difficulty,
      platform,
      search,
      limit,
      offset,
      hasSession: !!session?.user?.id,
    });

    // Build WHERE conditions
    const conditions = [];

    // Filter by company - decode the company name from URL
    const decodedCompany = decodeURIComponent(company).replace(/-/g, ' ').trim();
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM unnest(${problems.companyTags}) AS tag 
        WHERE LOWER(TRIM(tag)) = LOWER(TRIM(${decodedCompany}))
      )`
    );

    // Filter by difficulty if specified
    if (difficulty && difficulty !== 'all' && difficulty !== 'undefined') {
      const difficultyUpper = difficulty.toUpperCase();
      conditions.push(eq(problems.difficulty, difficultyUpper as 'EASY' | 'MEDIUM' | 'HARD'));
    }

    // Filter by platform if specified
    if (platform && platform !== 'all' && platform !== 'undefined') {
      conditions.push(eq(problems.platform, platform.toUpperCase().trim() as 'LEETCODE' | 'CODEFORCES' | 'HACKERRANK' | 'GEEKSFORGEEKS'));
    }

    // Search in title or slug
    if (search && search.trim()) {
      conditions.push(
        or(
          ilike(problems.title, `%${search}%`),
          ilike(problems.slug, `%${search}%`)
        )
      );
    }

    // Combine all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Dynamic sorting
    let orderByClause;
    switch (sortBy) {
      case 'likes':
        orderByClause = sortOrder === 'asc' ? problems.likes : desc(problems.likes);
        break;
      case 'acceptance':
        orderByClause = sortOrder === 'asc' ? problems.acceptanceRate : desc(problems.acceptanceRate);
        break;
      case 'title':
        orderByClause = sortOrder === 'asc' ? problems.title : desc(problems.title);
        break;
      case 'difficulty':
        orderByClause = sortOrder === 'asc' ? problems.difficulty : desc(problems.difficulty);
        break;
      default:
        orderByClause = desc(problems.likes);
    }

    // Count total results
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(problems)
      .where(whereClause || sql`TRUE`);

    const total = countResult[0]?.count || 0;

    // Fetch paginated results with user progress if authenticated
    let result;

    if (session?.user?.id) {
      // Optimized query with user progress
      result = await db
        .select({
          id: problems.id,
          title: problems.title,
          slug: problems.slug,
          difficulty: problems.difficulty,
          platform: problems.platform,
          likes: problems.likes,
          dislikes: problems.dislikes,
          acceptanceRate: problems.acceptanceRate,
          url: problems.url,
          topicTags: problems.topicTags,
          companyTags: problems.companyTags,
          isPremium: problems.isPremium,
          accepted: problems.accepted,
          submissions: problems.submissions,
          userProgress: {
            id: userProgress.id,
            status: userProgress.status,
            code: userProgress.code,
            language: userProgress.language,
            solvedAt: userProgress.solvedAt,
          },
        })
        .from(problems)
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.userId, session.user.id),
            eq(userProgress.problemId, problems.id)
          )
        )
        .where(whereClause || sql`TRUE`)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      // Fetch without user progress for non-authenticated users
      result = await db
        .select()
        .from(problems)
        .where(whereClause || sql`TRUE`)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    }

    console.log(`Returned ${result.length} company-wise problems (Total: ${total})`);

    // Calculate difficulty breakdown for the company
    const difficultyBreakdown = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    const allProblemsForBreakdown = await db
      .select({ difficulty: problems.difficulty })
      .from(problems)
      .where(whereClause || sql`TRUE`);

    allProblemsForBreakdown.forEach((p) => {
      if (p.difficulty in difficultyBreakdown) {
        difficultyBreakdown[p.difficulty as 'EASY' | 'MEDIUM' | 'HARD']++;
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      total,
      company: decodedCompany,
      difficultyBreakdown,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching company-wise problems:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company-wise problems', details: message },
      { status: 500 }
    );
  }
}
