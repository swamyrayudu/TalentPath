import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatConversations, chatMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Optional: Restrict to logged-in users
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    const { messages, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          // Instruct about the env var but present product-friendly name
          message: 'TalentPath AI is not configured. Please add your API key to the .env file (set PERPLEXITY_API_KEY).',
        },
        { status: 200 }
      );
    }

    // System prompt for the AI assistant
    const systemPrompt = `You are a helpful AI coding assistant for TalentPath, a platform for learning data structures, algorithms, and preparing for technical interviews. 

Your role is to:
- Help users understand coding problems and concepts
- Provide hints and explanations for DSA problems
- Assist with debugging and code optimization
- Answer questions about computer science fundamentals
- Guide users in their learning journey
- Be encouraging and supportive

Keep responses concise, clear, and beginner-friendly. Use code examples when helpful, formatted in markdown with triple backticks.`;

    // Filter out the initial assistant greeting message and prepare for the AI API
    // Be resilient to small changes in the greeting text (e.g., "TalentPath AI")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredMessages = messages.filter((msg: any, idx: number) => {
      // Skip a leading assistant greeting (if the first message is an assistant 'hello' message)
      // This uses a loose check for greetings so small text changes (like renaming the bot)
      // won't break the server-side validation.
      if (idx === 0 && msg.role === 'assistant') {
        const content = String(msg.content || '').toLowerCase();
        // If it looks like a greeting (contains "hello" or "hi"), treat it as the initial
        // automated assistant greeting and remove it from the prompt sent to the AI.
        if (content.includes('hello') || content.includes("hi") || content.includes('welcome')) {
          return false;
        }
      }
      return true;
    });

    // Ensure we have at least one user message
    if (filteredMessages.length === 0 || filteredMessages[0].role !== 'user') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid message format. Please send a user message first.' 
        },
        { status: 400 }
      );
    }

    // Prepare messages - add system context to first user message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiMessages = filteredMessages.map((msg: any, index: number) => {
      if (index === 0 && msg.role === 'user') {
        return {
          role: 'user',
          content: `[System Context: ${systemPrompt}]\n\n${msg.content}`,
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Call AI API (Perplexity under the hood)
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning', // reasoning model
        messages: aiMessages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('TalentPath AI API error:', errorData);
      return NextResponse.json(
        { 
          success: false,
          message: `API Error: ${response.status} ${errorData}. Please check your API key configuration.`,
        },
        { status: 200 }
      );
    }


    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content || 'No response generated';
    
    // Extract thinking content from <think> tags
    const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
    const reasoning = thinkMatch ? thinkMatch[1].trim() : (data.choices?.[0]?.message?.reasoning || null);

    // Remove <think> tags from the actual message
    const messageText = fullResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Save to database if user is logged in and conversationId is provided
    if (session?.user?.id && conversationId) {
      try {
        // Save user message
        await db.insert(chatMessages).values({
          conversationId,
          role: 'user',
          content: filteredMessages[filteredMessages.length - 1].content,
        });

        // Save assistant message
        await db.insert(chatMessages).values({
          conversationId,
          role: 'assistant',
          content: messageText,
          reasoning: reasoning || undefined,
        });

        // Update conversation updated_at
        await db
          .update(chatConversations)
          .set({ updatedAt: new Date() })
          .where(eq(chatConversations.id, conversationId));
      } catch (dbError) {
        console.error('Error saving chat history:', dbError);
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      message: messageText,
      reasoning: reasoning, // Include reasoning/thinking data from <think> tags or API
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sorry, I encountered an error. Please try again.' 
      },
      { status: 200 }
    );
  }
}
