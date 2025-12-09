'use server';

import { auth } from '../lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getCurrentUser() {
  const session = await auth();
  
  if (!session || !session.user?.email) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  return user;
}

export async function getAllUsers() {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized: Please login');
  }

  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      lastActiveAt: true,
      lastLogoutAt: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  return allUsers;
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized: Please login');
  }

  // Prevent admin from demoting themselves
  if (!session.user?.id) {
    throw new Error('User ID not found');
  }

  if (session.user.id === userId && newRole === 'user') {
    throw new Error('Cannot demote yourself from admin');
  }

  const updatedUser = await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, userId))
    .returning();

  // Revalidate all paths to refresh server components
  revalidatePath('/', 'layout');

  return updatedUser[0];
}

export async function deleteUser(userId: string) {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized: Please login');
  }

  if (!session.user?.id) {
    throw new Error('User ID not found');
  }

  // Prevent users from deleting themselves
  if (session.user.id === userId) {
    throw new Error('Cannot delete your own account');
  }

  await db.delete(users).where(eq(users.id, userId));

  revalidatePath('/admin');
  
  return { success: true };
}
