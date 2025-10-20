import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (!topic) {
      // Return all table names (topics) from Postgres
      console.log('Fetching all topics...');
      
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      

    

      // Fix: result is an array directly, not result.rows
      const topics = result
  .map((row: any) => row.table_name)
  .filter((name: string) => {
    // Exclude system/app tables
    const excludedTables = [
      'account', 'admin_questions', 'admin_test_cases', 'companies', 
      'contest_leaderboard', 'contest_participants', 'contest_questions', 
      'contest_submissions', 'contest_test_cases', 'contests', 
      'jobs', 'problems', 'questions', 'roadmap_steps', 'roadmaps', 
      'session', 'topics', 'user', 'user_progress', 'user_roadmap_progress', 
      'verificationToken'
    ];
    return !excludedTables.includes(name);
  });

      return NextResponse.json({ success: true, topics });
    }

    // Sanitize topic name to prevent SQL injection
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '');
    console.log('Fetching questions for topic:', sanitizedTopic);

    // Return questions from the specific topic table
    const questionsList = await db.execute(sql.raw(`SELECT * FROM "${sanitizedTopic}"`));

    return NextResponse.json({ success: true, questions: questionsList });
    
  } catch (error: unknown) {
    console.error('API Error:', error);
    const msg = (error as any)?.message ?? String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
