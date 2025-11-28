import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 *    
 * Debug endpoint to check session and user sync status
 * Access: /api/debug/session
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({
        error: 'Not authenticated',
        session: null,
        userInDb: null,
      });
    }

    const sessionUserId = session.user.id;

    if (!sessionUserId) {
      return NextResponse.json({
        error: 'Session user is missing an id',
        session: session.user,
        userInDb: null,
      });
    }

    // Check if user exists in database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, sessionUserId),
    });

    return NextResponse.json({
      session: {
        userId: sessionUserId,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as { role?: string | null }).role ?? dbUser?.role ?? 'user',
      },
      userInDb: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
      } : null,
      synced: !!dbUser,
      fix: !dbUser ? {
        message: 'User not found in database. Please sign out and sign in again.',
        sqlFix: `
-- Run this in Supabase SQL Editor to manually create your user:
INSERT INTO "user" (id, name, email, "emailVerified", image, role, created_at)
VALUES (
  '${session.user.id}',
  '${session.user.name || 'User'}',
  '${session.user.email}',
  NOW(),
  ${session.user.image ? `'${session.user.image}'` : 'NULL'},
  'user',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
        `.trim(),
      } : null,
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Failed to check session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
