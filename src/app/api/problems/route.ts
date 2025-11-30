import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems, users, visibleProblems } from '@/lib/db/schema';
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
    const onlyApproved = searchParams.get('onlyApproved') === 'true';
    const bypassVisibility = searchParams.get('bypassVisibility') === 'true';

    const useVisibleProblems = onlyApproved && !bypassVisibility;
    const baseTable = useVisibleProblems ? visibleProblems : problems;
    const baseTableName = useVisibleProblems ? 'visible_problems' : 'problems';

    const arrayElementExpr = (column: string) => sql.raw(`
      jsonb_array_elements_text(
        CASE
          WHEN "${baseTableName}"."${column}" IS NULL THEN '[]'::jsonb
          WHEN pg_typeof("${baseTableName}"."${column}")::text IN ('json', 'jsonb') THEN
            CASE
              WHEN jsonb_typeof("${baseTableName}"."${column}"::jsonb) = 'array' THEN "${baseTableName}"."${column}"::jsonb
              WHEN jsonb_typeof("${baseTableName}"."${column}"::jsonb) = 'string' AND (("${baseTableName}"."${column}"::jsonb) #>> '{}') LIKE '[%' THEN
                COALESCE(NULLIF(BTRIM(("${baseTableName}"."${column}"::jsonb) #>> '{}'), '')::jsonb, '[]'::jsonb)
              WHEN jsonb_typeof("${baseTableName}"."${column}"::jsonb) = 'string' THEN jsonb_build_array(("${baseTableName}"."${column}"::jsonb) #>> '{}')
              ELSE '[]'::jsonb
            END
          ELSE
            CASE
              WHEN jsonb_typeof(to_jsonb("${baseTableName}"."${column}")) = 'array' THEN to_jsonb("${baseTableName}"."${column}")
              WHEN jsonb_typeof(to_jsonb("${baseTableName}"."${column}")) = 'string' AND (to_jsonb("${baseTableName}"."${column}") #>> '{}') LIKE '[%' THEN
                COALESCE(NULLIF(BTRIM((to_jsonb("${baseTableName}"."${column}") #>> '{}')), '')::jsonb, '[]'::jsonb)
              WHEN jsonb_typeof(to_jsonb("${baseTableName}"."${column}")) = 'string' THEN jsonb_build_array((to_jsonb("${baseTableName}"."${column}") #>> '{}'))
              ELSE '[]'::jsonb
            END
        END
      )
    `);

    const topicTagsExpr = arrayElementExpr('topic_tags');
    const topicSlugsExpr = arrayElementExpr('topic_slugs');
    const companyTagsExpr = arrayElementExpr('company_tags');

    console.log('🔍 Fetching problems with filters:', { 
      topic, company, difficulty, platform, onlyApproved, bypassVisibility, hasSession: !!session?.user?.id,
      useVisibleProblems, baseTableName 
    });

    const conditions = [];

    // Apply Filters
    if (difficulty && difficulty !== 'all') {
      // Normalize difficulty to uppercase to match enum
      const difficultyUpper = difficulty.toUpperCase();
      conditions.push(eq(baseTable.difficulty, difficultyUpper as 'EASY' | 'MEDIUM' | 'HARD'));
      console.log(`🎯 Filtering by difficulty: ${difficultyUpper}`);
    }

    if (platform && platform !== 'all') {
      conditions.push(eq(baseTable.platform, platform.toUpperCase().trim() as 'LEETCODE' | 'CODEFORCES' | 'HACKERRANK' | 'GEEKSFORGEEKS'));
    }

    if (topic && topic !== 'all' && topic !== 'undefined') {
      const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
      console.log(`🏷️  Topic filter: "${topic}" → slug: "${topicSlug}"`);
      conditions.push(
        sql`(
          EXISTS (
            SELECT 1 FROM ${topicTagsExpr} AS tag 
            WHERE LOWER(tag) = LOWER(${topic})
          )
          OR EXISTS (
            SELECT 1 FROM ${topicSlugsExpr} AS slug
            WHERE LOWER(slug) = LOWER(${topicSlug})
          )
        )`
      );
    }

    if (company && company !== 'all' && company !== 'undefined') {
      const companyName = decodeURIComponent(company).replace(/-/g, ' ');
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${companyTagsExpr} AS tag 
          WHERE LOWER(tag) = LOWER(${companyName})
        )`
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(baseTable.title, `%${search}%`),
          ilike(baseTable.slug, `%${search}%`)
        )
      );
    }

    // Combine filters with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    console.log(`📋 Total conditions applied: ${conditions.length}`);
    if (difficulty) {
      console.log(`🔍 Difficulty filter active: ${difficulty.toUpperCase()}`);
    }
    if (topic) {
      console.log(`🏷️  Topic filter: "${topic}" -> slug: "${topic.toLowerCase().replace(/\s+/g, '-')}"`);
    }

    // Dynamic sorting
    let orderByClause;
    switch (sortBy) {
      case 'likes':
        orderByClause = sortOrder === 'asc' ? baseTable.likes : desc(baseTable.likes);
        break;
      case 'acceptance':
        orderByClause = sortOrder === 'asc' ? baseTable.acceptanceRate : desc(baseTable.acceptanceRate);
        break;
      case 'title':
        orderByClause = sortOrder === 'asc' ? baseTable.title : desc(baseTable.title);
        break;
      case 'difficulty':
        orderByClause = sortOrder === 'asc' ? baseTable.difficulty : desc(baseTable.difficulty);
        break;
      default:
        orderByClause = desc(baseTable.likes);
    }

    // Count total results
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(baseTable)
      .where(whereClause || sql`TRUE`);

    const total = countResult[0]?.count || 0;

    // Fetch paginated results
    const result = await db
      .select()
      .from(baseTable)
      .where(whereClause || sql`TRUE`)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    console.log(`Returned ${result.length} problems (Total: ${total})`);
    
    // Debug: Check if visible_problems is empty
    if (total === 0 && useVisibleProblems && platform && difficulty) {
      try {
        const vpCount = await db.execute(
          sql`SELECT COUNT(*) as total FROM visible_problems`
        );
        const vpPlatformCount = await db.execute(
          sql`SELECT COUNT(*) as count FROM visible_problems 
              WHERE platform = ${platform.toUpperCase()} AND difficulty = ${difficulty.toUpperCase()}`
        );
        const vpCountArr = vpCount as unknown as { total: string }[];
        const vpPlatformCountArr = vpPlatformCount as unknown as { count: string }[];
        console.log(`visible_problems: ${vpCountArr[0]?.total || 0} total, ${vpPlatformCountArr[0]?.count || 0} for ${platform} ${difficulty}`);
        
        if (parseInt(vpCountArr[0]?.total || '0') === 0) {
          console.log('visible_problems table is EMPTY! Run sync_visible_problems()');
        }
      } catch (err) {
        console.log('Debug query failed:', err);
      }
    }
    
    // Debug: Show sample difficulties from results
    if (difficulty && result.length > 0) {
      const difficulties = result.slice(0, 5).map((p) => (p as { difficulty: string | null }).difficulty);
      console.log('Sample difficulties from results:', difficulties);
      const uniqueDifficulties = [...new Set(result.map((p) => (p as { difficulty: string | null }).difficulty))];
      console.log('Unique difficulties in results:', uniqueDifficulties);
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      total,
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
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
      const adminUserId = session.user.id;
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, adminUserId))
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