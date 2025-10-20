import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNotification, notifyJobPosted } from '@/actions/notifications.actions';
import { db } from '@/lib/db';
import { users, notifications, notificationPreferences } from '@/lib/db/schema';

// Test endpoint to check notification system
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Check database tables
    if (action === 'check-tables') {
      try {
        const notifCount = await db.select().from(notifications).limit(1);
        const prefCount = await db.select().from(notificationPreferences).limit(1);
        
        return NextResponse.json({
          success: true,
          message: 'Tables exist!',
          notifications: 'exists',
          preferences: 'exists'
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
          hint: 'Tables might not exist. Run the migration: migrations/add_notifications.sql'
        }, { status: 500 });
      }
    }

    // Test creating a notification
    if (action === 'test-notification') {
      if (!session.user.id) {
        return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
      }
      
      const result = await createNotification({
        userId: session.user.id,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works!',
        link: '/dashboard'
      });

      return NextResponse.json(result);
    }

    // Test job notification
    if (action === 'test-job-notification') {
      const result = await notifyJobPosted(
        'test-job-id',
        'Test Software Engineer',
        'Test Company Inc'
      );

      return NextResponse.json(result);
    }

    // Get system info
    const allUsers = await db.query.users.findMany({
      columns: { id: true, role: true, email: true }
    });

    const allNotifications = await db.query.notifications.findMany({
      limit: 10,
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)]
    });

    const allPreferences = await db.query.notificationPreferences.findMany({
      limit: 10
    });

    return NextResponse.json({
      success: true,
      info: {
        totalUsers: allUsers.length,
        userBreakdown: {
          admins: allUsers.filter(u => u.role === 'admin').length,
          users: allUsers.filter(u => u.role === 'user').length
        },
        recentNotifications: allNotifications.length,
        preferences: allPreferences.length
      },
      users: allUsers,
      recentNotifications: allNotifications,
      preferences: allPreferences,
      testUrls: {
        checkTables: '/api/test-notifications?action=check-tables',
        testNotification: '/api/test-notifications?action=test-notification',
        testJobNotification: '/api/test-notifications?action=test-job-notification'
      }
    });
  } catch (error: any) {
    console.error('Test notification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
