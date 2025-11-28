import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const APTITUDE_TOPICS = new Set([
  'alligation-or-mixture',
  'area',
  'average',
  'bankers-discount',
  'boats-and-steams',
  'calender',
  'chain-rule',
  'clock',
  'compound-interest',
  'decimal-fraction',
  'height-and-distance',
  'logarithm',
  'numbers',
  'odd-man-out-and-series',
  'partnership',
  'percentage',
  'permutation-and-combination',
  'pipes-and-cistern',
  'problems-on-ages',
  'problems-on-hcf-and-lcm',
  'problems-on-trains',
  'probobility',
  'profit-and-loss',
  'races-and-games',
  'ratio-and-proportion',
  'simple-interest',
  'simplification',
  'square-root-and-cube-root',
  'stocks-and-shares',
  'surds-and-indices',
  'time-and-distance',
  'time-and-work',
  'true-discount',
  'volume-and-surface',
]);

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
        .map((row: Record<string, unknown>) => row.table_name as string)
        .filter((name: string) => APTITUDE_TOPICS.has(name));

      return NextResponse.json({ success: true, topics });
    }

    // Sanitize topic name to prevent SQL injection
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!APTITUDE_TOPICS.has(sanitizedTopic)) {
      return NextResponse.json({ success: false, error: 'Invalid aptitude topic' }, { status: 400 });
    }
    console.log('Fetching questions for topic:', sanitizedTopic);

    // Return questions from the specific topic table
    const questionsList = await db.execute(sql.raw(`SELECT * FROM "${sanitizedTopic}"`));

    return NextResponse.json({ success: true, questions: questionsList });
    
  } catch (error: unknown) {
    console.error('API Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
