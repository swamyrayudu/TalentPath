import { NextResponse } from 'next/server';
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification 
} from '@/actions/notifications.actions';

// GET - Fetch notifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (unreadOnly) {
      const result = await getUnreadNotificationCount();
      return NextResponse.json(result);
    }

    const result = await getUserNotifications(50);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const result = await markAllNotificationsAsRead();
      return NextResponse.json(result);
    }

    if (notificationId) {
      const result = await markNotificationAsRead(notificationId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Missing notificationId or markAll parameter' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Missing notification ID' },
        { status: 400 }
      );
    }

    const result = await deleteNotification(notificationId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
