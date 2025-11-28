import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Helper function to sync visible_problems table
async function syncVisibleProblems() {
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
}

export async function POST() {
  try {
    const session = await auth();
    
    // Check admin by email or use type assertion for role
    const user = session?.user as { email?: string; role?: string } | undefined;
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@talentpath.com';
    
    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('Starting sync_visible_problems...');
    
    // Call the sync function using Drizzle
    await syncVisibleProblems();
    
    // Get counts
    const vpCount = await db.execute(sql`SELECT COUNT(*) as count FROM visible_problems`) as unknown as { count: string }[];
    const problemsCount = await db.execute(sql`SELECT COUNT(*) as count FROM problems WHERE is_visible_to_users = true`) as unknown as { count: string }[];
    
    console.log('Sync complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Visible problems synced successfully',
      visibleProblemsCount: vpCount[0]?.count || 0,
      sourceProblemsCount: problemsCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
