import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, count } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total user count
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get recent 5 users
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    return NextResponse.json({
      totalUsers,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name || 'User',
        designation: 'Member',
        image: user.image || '',
        fallbackLetter: (user.name || user.email || 'U')[0].toUpperCase(),
      })),
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
