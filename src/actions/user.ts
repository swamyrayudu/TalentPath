'use server';

import { auth } from '../lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  return user;
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin' | 'moderator') {
  const session = await auth();
  
  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const updatedUser = await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser[0];
}
