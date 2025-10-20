import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems, users } from '@/lib/db/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const difficulty = searchParams.get('difficulty');
    const platform = searchParams.get('platform');
    const topic = searchParams.get('topic');
    const company = searchParams.get('company'); // <── new param
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'likes';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Decode company name if it's a slug
    const decodedCompany = company ? decodeURIComponent(company).replace(/-/g, ' ') : null;

    const baseQuery = db.select().from(problems);
    const conditions = [];

    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(problems.difficulty, difficulty as any));
    }

    if (platform && platform !== 'all') {
      conditions.push(eq(problems.platform, platform.toUpperCase().trim() as any));
    }

    if (topic && topic !== 'all' && topic !== 'undefined') {
      // Check both topicTags (for exact match, case-insensitive) and topicSlugs (for slug match)
      const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM unnest(${problems.topicTags}) AS tag 
          WHERE LOWER(tag) = LOWER(${topic})
        ) OR ${problems.topicSlugs} && ARRAY[${topicSlug}]`
      );
    }
    if (company && company !== 'all' && company !== 'undefined') {
      // Decode and handle company name properly (convert slug to name)
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

    const query = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

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

    // Total count
    const countResult = await (conditions.length > 0
      ? db.select({ count: sql<number>`count(*)::int` }).from(problems).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)::int` }).from(problems));

    const total = countResult[0]?.count || 0;

    // Fetch paginated problems
    const result = await query.orderBy(orderByClause).limit(limit).offset(offset);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      total,
    });
  } catch (error) {
    console.error('❌ Error fetching problems:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch problems',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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