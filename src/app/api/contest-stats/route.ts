import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserContestStats } from '@/actions/contest.actions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getUserContestStats(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch contest stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Contest stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
