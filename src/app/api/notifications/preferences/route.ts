import { NextResponse } from 'next/server';
import { 
  getNotificationPreferences,
  updateNotificationPreferences 
} from '@/actions/notifications.actions';

// GET - Fetch notification preferences
export async function GET() {
  try {
    const result = await getNotificationPreferences();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST - Update notification preferences
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updateNotificationPreferences(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
