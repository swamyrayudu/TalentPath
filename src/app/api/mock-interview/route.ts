import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mockInterviews, interviewTranscripts, users } from '@/lib/db/schema';
import type { InterviewType, InterviewStatus } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Get all interviews for the current user
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
    const type = searchParams.get('type') as InterviewType | null;
    const status = searchParams.get('status') as InterviewStatus | null;

    const conditions = [eq(mockInterviews.userId, session.user.id)];
    
    if (type) {
      conditions.push(eq(mockInterviews.type, type));
    }
    
    if (status) {
      conditions.push(eq(mockInterviews.status, status));
    }

    const interviews = await db
      .select()
      .from(mockInterviews)
      .where(and(...conditions))
      .orderBy(desc(mockInterviews.createdAt));

    return NextResponse.json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// Create a new interview session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const { type, difficulty, companyName } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Interview type is required' },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const userExists = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    });

    if (!userExists) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { success: false, error: 'User account not found. Please sign out and sign in again to refresh your account.' },
        { status: 404 }
      );
    }

    // Create new interview session
    const [interview] = await db.insert(mockInterviews).values({
      userId: userId,
      type,
      difficulty: difficulty || 'intermediate',
      companyName: companyName || null,
      status: 'in-progress',
    }).returning();

    // Add initial interviewer greeting
    await db.insert(interviewTranscripts).values({
      interviewId: interview.id,
      role: 'interviewer',
      message: getInitialGreeting(type, difficulty, companyName),
    });

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}

// Update interview (submit answer, complete, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { interviewId, status, score, feedback, strengths, improvements, completedAt } = body;

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existingInterview] = await db
      .select()
      .from(mockInterviews)
      .where(and(
        eq(mockInterviews.id, interviewId),
        eq(mockInterviews.userId, session.user.id)
      ));

    if (!existingInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Update interview
    const updateData: Partial<{
      status: InterviewStatus;
      score: number;
      feedback: string;
      strengths: unknown;
      improvements: unknown;
      completedAt: Date;
    }> = {};
    
    if (status) updateData.status = status as InterviewStatus;
    if (score !== undefined) updateData.score = score;
    if (feedback) updateData.feedback = feedback;
    if (strengths) updateData.strengths = strengths;
    if (improvements) updateData.improvements = improvements;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const [updated] = await db
      .update(mockInterviews)
      .set(updateData)
      .where(eq(mockInterviews.id, interviewId))
      .returning();

    return NextResponse.json({
      success: true,
      interview: updated,
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}

function getInitialGreeting(type: string, difficulty?: string, companyName?: string): string {
  const greetings = {
    'dsa-coding': `Hello! I'm your AI interviewer for today's DSA and coding interview${difficulty ? ` (${difficulty} level)` : ''}. I'll be asking you a series of coding problems to assess your problem-solving skills and coding ability. Are you ready to begin?`,
    
    'system-design': `Welcome! I'm your AI interviewer for this system design interview${difficulty ? ` (${difficulty} level)` : ''}. We'll be designing scalable systems together. I'll ask you to explain your thought process and architectural decisions. Ready to start?`,
    
    'behavioral': `Hello! I'm conducting your behavioral interview today${difficulty ? ` (${difficulty} level)` : ''}. I'll ask you questions about your past experiences, how you handle challenges, and your teamwork skills. Please share specific examples from your experience. Shall we begin?`,
    
    'company-specific': `Welcome to your ${companyName || 'company-specific'} mock interview${difficulty ? ` (${difficulty} level)` : ''}! I'll be conducting an interview similar to what you'd experience at ${companyName || 'top tech companies'}. This will include technical questions and behavioral scenarios. Are you ready?`,
  };

  return greetings[type as keyof typeof greetings] || greetings['dsa-coding'];
}
