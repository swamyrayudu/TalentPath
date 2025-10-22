import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems, users } from '@/lib/db/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const difficulty = searchParams.get('difficulty');
    const platform = searchParams.get('platform');
    const topic = searchParams.get('topic');
    const company = searchParams.get('company');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'likes';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');
    const onlyApproved = searchParams.get('onlyApproved') === 'true'; // Force approved filter
    const bypassVisibility = searchParams.get('bypassVisibility') === 'true'; // Bypass visibility for difficulty sheets

    console.log('🔍 Fetching problems with filters:', { 
      topic, company, difficulty, platform, onlyApproved, bypassVisibility, hasSession: !!session?.user?.id 
    });

    // Check admin role
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
      console.log('👤 No session - treating as regular user');
    }

    const conditions = [];

    // ✅ Apply admin approval filter for non-admins OR if onlyApproved is explicitly requested
    // UNLESS bypassVisibility is true (for difficulty-based DSA sheets)
    if ((!isAdmin || onlyApproved) && !bypassVisibility) {
      try {
        conditions.push(eq(problems.isVisibleToUsers, true));
        if (onlyApproved) {
          console.log('✅ Applied admin approval filter (onlyApproved=true)');
        } else {
          console.log('✅ Applied admin approval filter for non-admin user');
        }
      } catch (err) {
        console.error('⚠️ WARNING: isApproved column may not exist yet!');
        console.error('⚠️ Please ensure migration is applied.');
      }
    } else if (bypassVisibility) {
      console.log('⚠️ Bypassing visibility filter for difficulty-based sheet');
    } else {
      console.log('🔓 Admin user - showing all problems');
    }

    // Apply Filters
    if (difficulty && difficulty !== 'all') {
      // Normalize difficulty to uppercase to match enum
      const difficultyUpper = difficulty.toUpperCase();
      conditions.push(eq(problems.difficulty, difficultyUpper as any));
      console.log(`🎯 Filtering by difficulty: ${difficultyUpper}`);
    }

    if (platform && platform !== 'all') {
      conditions.push(eq(problems.platform, platform.toUpperCase().trim() as any));
    }

    if (topic && topic !== 'all' && topic !== 'undefined') {
      const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
      conditions.push(
        sql`(
          EXISTS (
            SELECT 1 FROM unnest(${problems.topicTags}) AS tag 
            WHERE LOWER(tag) = LOWER(${topic})
          )
          OR ${problems.topicSlugs} && ARRAY[${topicSlug}]
        )`
      );
    }

    if (company && company !== 'all' && company !== 'undefined') {
      const companyName = decodeURIComponent(company).replace(/-/g, ' ');
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM unnest(${problems.companyTags}) AS tag 
          WHERE LOWER(tag) = LOWER(${companyName})
        )`
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(problems.title, `%${search}%`),
          ilike(problems.slug, `%${search}%`)
        )
      );
    }

    // Combine filters with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    console.log(`📋 Total conditions applied: ${conditions.length}`);
    if (difficulty) {
      console.log(`🔍 Difficulty filter active: ${difficulty.toUpperCase()}`);
    }

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

    // Fetch paginated results
    const result = await db
      .select()
      .from(problems)
      .where(whereClause || sql`TRUE`)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    console.log(`✅ Returned ${result.length} problems (Total: ${total})`);
    
    // Debug: Show sample difficulties from results
    if (difficulty && result.length > 0) {
      const difficulties = result.slice(0, 5).map((p: any) => p.difficulty);
      console.log('📊 Sample difficulties from results:', difficulties);
      const uniqueDifficulties = [...new Set(result.map((p: any) => p.difficulty))];
      console.log('🎯 Unique difficulties in results:', uniqueDifficulties);
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      total,
      isAdmin
    });
  } catch (error) {
    console.error('❌ Error fetching problems:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems', details: message },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if this is a progress update or problem creation
    const data = await request.json();
    
    // If it has problemId, it's a progress update
    if (data.problemId) {
      const { problemId, status, code, language, solvedAt } = data;

      // Check if progress exists
      const existing = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, session.user.id),
            eq(userProgress.problemId, problemId)
          )
        )
        .limit(1);

      let result;

      if (existing.length > 0) {
        // Update existing progress
        result = await db
          .update(userProgress)
          .set({
            status,
            code,
            language,
            solvedAt: solvedAt ? new Date(solvedAt) : null,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existing[0].id))
          .returning();
      } else {
        // Create new progress
        result = await db
          .insert(userProgress)
          .values({
            userId: session.user.id,
            problemId,
            status,
            code,
            language,
            solvedAt: solvedAt ? new Date(solvedAt) : null,
          })
          .returning();
      }

      return NextResponse.json({
        success: true,
        data: result[0],
      });
    } else {
      // It's a problem creation - check admin permissions
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

      const problemData = {
        title: data.title,
        slug: data.slug,
        isPremium: data.isPremium || false,
        difficulty: data.difficulty,
        platform: data.platform || 'LEETCODE',
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        acceptanceRate: data.acceptanceRate?.toString(),
        url: data.url,
        topicTags: data.topicTags || [],
        companyTags: data.companyTags || [],
        mainTopics: data.mainTopics || [],
        topicSlugs: data.topicSlugs || [],
        accepted: data.accepted || 0,
        submissions: data.submissions || 0,
        similarQuestions: data.similarQuestions || [],
      };

      const result = await db.insert(problems).values(problemData).returning();

      return NextResponse.json({
        success: true,
        data: result[0],
      });
    }
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}