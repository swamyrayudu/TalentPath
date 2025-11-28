import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { problems, users } from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Helper function to sync visible_problems table after visibility changes
async function syncVisibleProblems() {
  try {
    // Delete all from visible_problems first
    await db.execute(sql`DELETE FROM visible_problems`);
    
    // Insert only visible problems from problems table
    // Match the exact database schema columns
    await db.execute(sql`
      INSERT INTO visible_problems (
        id, title, slug, is_premium, difficulty, platform, likes, dislikes,
        acceptance_rate, url, topic_tags, company_tags, main_topics,
        topic_slugs, accepted, submissions, similar_questions, 
        created_at, updated_at, is_visible_to_users
      )
      SELECT 
        id, title, slug, is_premium, difficulty, platform, 
        likes::text, dislikes::text,
        acceptance_rate, url, 
        to_jsonb(topic_tags), to_jsonb(company_tags), to_jsonb(main_topics),
        to_jsonb(topic_slugs), accepted::text, submissions, similar_questions,
        created_at, updated_at, is_visible_to_users
      FROM problems
      WHERE is_visible_to_users = true
    `);
    
    console.log('✅ visible_problems table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing visible_problems:', error);
    throw error;
  }
}

// PATCH - Toggle visibility for specific problems
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    const { problemIds, isVisible } = await request.json();

    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'problemIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isVisible must be a boolean' },
        { status: 400 }
      );
    }

    // Convert problemIds to numbers (bigint in database)
    const numericProblemIds = problemIds.map((id: string | number) => 
      typeof id === 'string' ? parseInt(id, 10) : id
    ).filter((id: number) => !isNaN(id));

    if (numericProblemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid problem IDs provided' },
        { status: 400 }
      );
    }

    console.log('📝 Updating visibility for problems:', numericProblemIds, 'to:', isVisible);

    // Update the visibility of the specified problems
    const result = await db
      .update(problems)
      .set({ 
        isVisibleToUsers: isVisible,
        updatedAt: new Date()
      })
      .where(inArray(problems.id, numericProblemIds))
      .returning();

    console.log('✅ Updated', result.length, 'problems');

    // Sync visible_problems table after update
    await syncVisibleProblems();

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully ${isVisible ? 'showed' : 'hidden'} ${result.length} problem(s)`,
    });
  } catch (error) {
    console.error('Error updating problem visibility:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update problem visibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Bulk toggle visibility (show/hide all matching filters)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user[0]?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, difficulty, platform, limit } = await request.json();

    if (!['show_all', 'hide_all', 'show_filtered'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    let updateQuery;
    let message = '';

    switch (action) {
      case 'show_all':
        // Show all problems
        updateQuery = db
          .update(problems)
          .set({ isVisibleToUsers: true, updatedAt: new Date() })
          .returning();
        message = 'All problems are now visible to users';
        break;

      case 'hide_all':
        // Hide all problems
        updateQuery = db
          .update(problems)
          .set({ isVisibleToUsers: false, updatedAt: new Date() })
          .returning();
        message = 'All problems are now hidden from users';
        break;

      case 'show_filtered': {
        // Show filtered problems (by difficulty, platform, etc.)
        const conditions = [];
        
        if (difficulty) {
          conditions.push(eq(problems.difficulty, difficulty as 'EASY' | 'MEDIUM' | 'HARD'));
        }
        
        if (platform) {
          conditions.push(eq(problems.platform, platform as 'LEETCODE' | 'CODEFORCES' | 'HACKERRANK' | 'GEEKSFORGEEKS'));
        }

        if (conditions.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No filters provided' },
            { status: 400 }
          );
        }

        // Get problem IDs matching filters
        const matchingProblems = await db
          .select({ id: problems.id })
          .from(problems)
          .where(conditions.length > 0 ? eq(problems.id, problems.id) : undefined)
          .limit(limit || 1000);

        if (matchingProblems.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            message: 'No problems found matching filters',
          });
        }

        const problemIds = matchingProblems.map(p => p.id);
        
        updateQuery = db
          .update(problems)
          .set({ isVisibleToUsers: true, updatedAt: new Date() })
          .where(inArray(problems.id, problemIds))
          .returning();
        
        message = `Showing ${matchingProblems.length} problem(s) matching filters`;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await updateQuery;

    // Sync visible_problems table after bulk update
    await syncVisibleProblems();

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      message,
    });
  } catch (error) {
    console.error('Error bulk updating problem visibility:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to bulk update problem visibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
