import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mockInterviews, interviewTranscripts } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Verify interview ownership
    const [interview] = await db
      .select()
      .from(mockInterviews)
      .where(and(
        eq(mockInterviews.id, interviewId),
        eq(mockInterviews.userId, session.user.id)
      ));

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Get all messages for this interview
    const messages = await db
      .select()
      .from(interviewTranscripts)
      .where(eq(interviewTranscripts.interviewId, interviewId))
      .orderBy(asc(interviewTranscripts.timestamp));

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.message,
        timestamp: msg.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
