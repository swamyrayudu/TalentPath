import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// API endpoint to update user's last active time or logout time
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a logout/leave event
    let isLogout = false;
    try {
      const body = await request.json();
      isLogout = body?.type === 'logout';
    } catch {
      // No body or invalid JSON, treat as activity update
    }

    if (isLogout) {
      // Update the user's last logout timestamp (when they leave/close)
      await db
        .update(users)
        .set({ lastLogoutAt: new Date() })
        .where(eq(users.id, session.user.id));
    } else {
      // Update the user's last active timestamp
      await db
        .update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
