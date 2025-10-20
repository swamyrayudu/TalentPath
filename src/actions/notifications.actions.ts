'use server';

import { db } from '@/lib/db';
import { 
  notifications, 
  notificationPreferences,
  users 
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// NOTIFICATION TYPES
// ============================================

type NotificationType = 
  | 'job_posted' 
  | 'contest_starting' 
  | 'contest_started' 
  | 'contest_ending'
  | 'contest_ended' 
  | 'system' 
  | 'achievement';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

// ============================================
// CREATE NOTIFICATION
// ============================================

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { userId, type, title, message, link, metadata } = params;

    // Check user preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // Check if user has disabled this type of notification
    if (prefs) {
      if (type === 'job_posted' && !prefs.jobNotifications) return { success: false };
      if ((type.includes('contest') || type === 'contest_starting' || type === 'contest_started') && !prefs.contestNotifications) return { success: false };
      if (type === 'system' && !prefs.systemNotifications) return { success: false };
    }

    const [notification] = await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    }).returning();

    revalidatePath('/dashboard');
    revalidatePath('/api/notifications');

    return { success: true, data: notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

// ============================================
// BULK CREATE NOTIFICATIONS
// ============================================

export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: any
) {
  try {
    console.log('📧 createBulkNotifications called:', {
      userCount: userIds.length,
      type,
      title
    });

    // Get users with their preferences
    const usersWithPrefs = await db
      .select({
        userId: users.id,
        jobNotifications: notificationPreferences.jobNotifications,
        contestNotifications: notificationPreferences.contestNotifications,
        systemNotifications: notificationPreferences.systemNotifications,
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId))
      .where(sql`${users.id} = ANY(${userIds})`);

    console.log('👥 Users with preferences fetched:', usersWithPrefs.length);

    // Filter users based on preferences
    const eligibleUserIds = usersWithPrefs.filter(user => {
      if (type === 'job_posted' && user.jobNotifications === false) return false;
      if ((type.includes('contest') || type === 'contest_starting' || type === 'contest_started') && user.contestNotifications === false) return false;
      if (type === 'system' && user.systemNotifications === false) return false;
      return true;
    }).map(user => user.userId);

    console.log('✅ Eligible users after filtering:', eligibleUserIds.length);

    if (eligibleUserIds.length === 0) {
      console.log('⚠️ No eligible users for notifications');
      return { success: true, count: 0 };
    }

    const notificationData = eligibleUserIds.map(userId => ({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    }));

    console.log('💾 Inserting notifications into database...');
    await db.insert(notifications).values(notificationData);
    console.log('✅ Notifications inserted successfully:', notificationData.length);

    revalidatePath('/dashboard');
    revalidatePath('/api/notifications');

    return { success: true, count: eligibleUserIds.length };
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    return { success: false, error: 'Failed to create bulk notifications' };
  }
}

// ============================================
// GET USER NOTIFICATIONS
// ============================================

export async function getUserNotifications(limit = 50) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      orderBy: [desc(notifications.createdAt)],
      limit,
    });

    return { success: true, data: userNotifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

// ============================================
// GET UNREAD COUNT
// ============================================

export async function getUnreadNotificationCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.read, false)
        )
      );

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { success: false, error: 'Failed to fetch unread count' };
  }
}

// ============================================
// MARK AS READ
// ============================================

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

// ============================================
// MARK ALL AS READ
// ============================================

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.read, false)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

// ============================================
// DELETE NOTIFICATION
// ============================================

export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

// ============================================
// GET/UPDATE NOTIFICATION PREFERENCES
// ============================================

export async function getNotificationPreferences() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, session.user.id),
    });

    // Create default preferences if they don't exist
    if (!prefs) {
      [prefs] = await db.insert(notificationPreferences).values({
        userId: session.user.id,
      }).returning();
    }

    return { success: true, data: prefs };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

export async function updateNotificationPreferences(preferences: {
  jobNotifications?: boolean;
  contestNotifications?: boolean;
  systemNotifications?: boolean;
  browserNotifications?: boolean;
  emailNotifications?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if preferences exist
    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, session.user.id),
    });

    let updated;
    if (existing) {
      [updated] = await db
        .update(notificationPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, session.user.id))
        .returning();
    } else {
      [updated] = await db
        .insert(notificationPreferences)
        .values({
          userId: session.user.id,
          ...preferences,
        })
        .returning();
    }

    revalidatePath('/dashboard');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

// ============================================
// NOTIFICATION HELPERS (For triggering)
// ============================================

// Called when admin posts a job
export async function notifyJobPosted(jobId: string, jobTitle: string, company: string) {
  try {
    console.log('🎯 notifyJobPosted called for:', { jobId, jobTitle, company });
    
    // Get all users except admin
    const allUsers = await db.query.users.findMany({
      where: eq(users.role, 'user'),
      columns: { id: true },
    });

    console.log('👥 Total users found (role=user):', allUsers.length);

    const userIds = allUsers.map(u => u.id);

    const result = await createBulkNotifications(
      userIds,
      'job_posted',
      `New Job: ${company}`,
      `${jobTitle} position is now open at ${company}`,
      `/jobs/${jobId}`,
      { jobId, company }
    );

    console.log('📬 Notification result:', result);
    return result.success ? { success: true } : result;
  } catch (error) {
    console.error('❌ Error notifying job posted:', error);
    return { success: false, error: 'Failed to send job notifications' };
  }
}

// Called when user joins a contest
export async function notifyContestStarting(contestId: string, contestTitle: string, startTime: Date, userId: string) {
  try {
    const minutesUntilStart = Math.round((startTime.getTime() - Date.now()) / 60000);

    if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
      await createNotification({
        userId,
        type: 'contest_starting',
        title: 'Contest Starting Soon!',
        message: `${contestTitle} starts in ${minutesUntilStart} minutes`,
        link: `/contest/${contestId}`,
        metadata: { contestId, startTime },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error notifying contest starting:', error);
    return { success: false };
  }
}

// Called when contest actually starts (by cron or trigger)
export async function notifyContestStarted(contestId: string, contestTitle: string) {
  try {
    // Get all participants
    const { contestParticipants } = await import('@/lib/db/schema');
    const participants = await db.query.contestParticipants.findMany({
      where: eq(contestParticipants.contestId, contestId),
      columns: { userId: true },
    });

    const userIds = participants.map(p => p.userId);

    await createBulkNotifications(
      userIds,
      'contest_started',
      'Contest Started!',
      `${contestTitle} has started. Join now!`,
      `/contest/${contestId}`,
      { contestId }
    );

    return { success: true };
  } catch (error) {
    console.error('Error notifying contest started:', error);
    return { success: false };
  }
}
