import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('🔄 Starting sync_visible_problems...');
    
    // Call the sync function
    await db.execute(sql`SELECT sync_visible_problems()`);
    
    // Get counts
    const vpCount = await db.execute(sql`SELECT COUNT(*) as count FROM visible_problems`);
    const problemsCount = await db.execute(sql`SELECT COUNT(*) as count FROM problems WHERE is_visible_to_users = true`);
    
    console.log('✅ Sync complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Visible problems synced successfully',
      visibleProblemsCount: vpCount.rows[0]?.count || 0,
      sourceProblemsCount: problemsCount.rows[0]?.count || 0
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
