import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatConversations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Get all conversations for a user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, session.user.id))
      .orderBy(desc(chatConversations.updatedAt));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// Create a new conversation or update existing one
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { conversationId, title } = await request.json();

    if (conversationId) {
      // Update existing conversation
      const [updated] = await db
        .update(chatConversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(chatConversations.id, conversationId))
        .returning();

      return NextResponse.json({ conversation: updated });
    } else {
      // Create new conversation
      const [newConversation] = await db
        .insert(chatConversations)
        .values({
          userId: session.user.id,
          title: title || 'New Conversation',
        })
        .returning();

      return NextResponse.json({ conversation: newConversation });
    }
  } catch (error) {
    console.error('Error creating/updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create/update conversation' },
      { status: 500 }
    );
  }
}

// Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const conversationId = body.conversationId;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to the user before deleting
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await db
      .delete(chatConversations)
      .where(eq(chatConversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
