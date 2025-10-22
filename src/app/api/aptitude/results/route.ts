import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { aptitudeResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Save aptitude test result
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const data = await request.json();
    const { topic, totalQuestions, correctAnswers, score, timeTaken, answers } = data;

    // Validate required fields
    if (!topic || totalQuestions === undefined || correctAnswers === undefined || score === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Insert the result
    const result = await db
      .insert(aptitudeResults)
      .values({
        userId: session.user.id,
        topic,
        totalQuestions,
        correctAnswers,
        score,
        timeTaken: timeTaken || null,
        answers: answers || {},
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      result: result[0] 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error saving aptitude result:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || 'Internal server error' 
    }, { status: 500 });
  }
}

// Get user's aptitude results
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    let query = db
      .select()
      .from(aptitudeResults)
      .where(eq(aptitudeResults.userId, session.user.id))
      .orderBy(desc(aptitudeResults.completedAt));

    // Filter by topic if provided
    if (topic) {
      query = db
        .select()
        .from(aptitudeResults)
        .where(eq(aptitudeResults.userId, session.user.id))
        .orderBy(desc(aptitudeResults.completedAt));
    }

    const results = await query;

    return NextResponse.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching aptitude results:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || 'Internal server error' 
    }, { status: 500 });
  }
}
