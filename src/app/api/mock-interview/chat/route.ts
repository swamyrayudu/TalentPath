import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mockInterviews, interviewTranscripts } from '@/lib/db/schema';
import type { InterviewTranscript } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const runtime = 'nodejs';

// System prompts for different interview types
const SYSTEM_PROMPTS = {
  'dsa-coding': `You are an experienced technical interviewer conducting a DSA coding interview. 
Your role:
- Ask progressively challenging algorithm and data structure questions
- Start with an easy warm-up, then increase difficulty
- Evaluate problem-solving approach, code quality, time/space complexity analysis
- Ask clarifying questions about edge cases
- Provide hints if candidate is stuck, but don't give away the solution
- After each answer, give constructive feedback on:
  * Approach correctness
  * Code quality and readability
  * Complexity analysis
  * Edge case handling
  
Total questions: 5 (1 easy, 2 medium, 2 hard)
Be encouraging but professional. Ask follow-ups like "Can you optimize this?" or "What about edge case X?"`,

  'system-design': `You are a senior system architect conducting a system design interview.
Your role:
- Present realistic system design scenarios (e.g., "Design Twitter", "Design URL shortener")
- Guide the candidate through the design process
- Ask about:
  * Requirements gathering (functional and non-functional)
  * Capacity estimation
  * Database schema design
  * API design
  * Scalability considerations
  * Trade-offs between different approaches
- Challenge their decisions: "What if traffic 10x? What if a service fails?"
- Evaluate architectural thinking, not just memorized solutions

Total questions: 3-4 major design problems
Be collaborative and guide them like a real interview.`,

  'behavioral': `You are an empathetic HR interviewer conducting a behavioral interview.
Your role:
- Ask behavioral questions using the STAR method (Situation, Task, Action, Result)
- Focus on:
  * Past work experiences
  * Teamwork and collaboration
  * Conflict resolution
  * Leadership examples
  * Handling failure and learning
  * Career motivations
- Listen actively and ask follow-up questions like:
  * "Tell me more about that situation"
  * "How did the team react?"
  * "What would you do differently?"
- Be supportive and create a comfortable environment
- Evaluate clarity, honesty, self-awareness

Total questions: 6-8 behavioral scenarios
Make it conversational and warm.`,

  'company-specific': `You are interviewing for {companyName}.
Your role:
- Conduct a realistic interview as this company would
- Mix technical and behavioral questions appropriate for the company culture
- For FAANG companies, focus on:
  * Google: Algorithm design, system scalability, Googleyness
  * Amazon: Leadership principles, customer obsession, dive deep
  * Microsoft: Technical depth, collaboration, growth mindset
  * Meta: Move fast, impact, technical excellence
  * Apple: Innovation, attention to detail, cross-functional collaboration
- Ask company-specific scenarios
- Evaluate both technical skills and cultural fit

Be professional and authentic to the company's interview style.`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      interviewId, 
      message, 
      currentQuestion, 
      interviewType, 
      resumeContext,
      jobRole,
      experienceLevel,
      companyName,
      specificTopics,
      isTimeout 
    } = body;

    if (!interviewId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify interview ownership
    const [interview] = await db
      .select()
      .from(mockInterviews)
      .where(and(
        eq(mockInterviews.id, interviewId),
        eq(mockInterviews.userId, session.user.id)
      ));

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Save user message to transcript
    await db.insert(interviewTranscripts).values({
      interviewId,
      role: 'candidate',
      message,
    });

    // Get conversation history
    const history = await db
      .select()
      .from(interviewTranscripts)
      .where(eq(interviewTranscripts.interviewId, interviewId))
      .orderBy(asc(interviewTranscripts.timestamp));

    // Check if Perplexity API is configured
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI service not configured. Please add PERPLEXITY_API_KEY to environment variables.',
        },
        { status: 200 }
      );
    }

    // Handle timeout feedback request
    if (isTimeout || message === 'TIME_LIMIT_REACHED') {
      const feedbackPrompt = `The interview time limit has been reached. Based on the conversation history, provide comprehensive feedback in this format:

**Overall Performance: [Score]/100**

**Strengths:**
- [List 2-3 key strengths demonstrated]

**Areas for Improvement:**
- [List 2-3 areas to work on]

**Detailed Feedback:**
[Provide specific, actionable feedback on their responses, technical skills, and communication]

**Recommendation:**
[Brief recommendation for next steps]

Be encouraging but honest. Consider their experience level: ${experienceLevel || 'intermediate'}.`;

      const aiMessages = [
        {
          role: 'user',
          content: feedbackPrompt,
        },
        ...history.slice(-10).map(msg => ({
          role: msg.role === 'interviewer' ? 'assistant' : 'user',
          content: msg.message,
        })),
      ];

      const aiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning',
          messages: aiMessages,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI service error');
      }

      const aiData = await aiResponse.json();
      const feedbackMessage = aiData.choices[0]?.message?.content || 'Interview completed. Thank you for your time!';

      // Save AI feedback
      await db.insert(interviewTranscripts).values({
        interviewId,
        role: 'interviewer',
        message: feedbackMessage,
      });

      // Extract score from feedback (look for number/100 pattern)
      const scoreMatch = feedbackMessage.match(/(\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

      return NextResponse.json({
        success: true,
        message: feedbackMessage,
        isComplete: true,
        feedback: {
          score,
          feedback: feedbackMessage,
        },
      });
    }

    // Prepare system prompt with configuration
    let systemPrompt = SYSTEM_PROMPTS[interviewType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS['dsa-coding'];
    
    if (interviewType === 'company-specific' && (companyName || interview.companyName)) {
      systemPrompt = systemPrompt.replace('{companyName}', companyName || interview.companyName || 'the company');
    }

    // Add job role context
    if (jobRole) {
      systemPrompt += `\n\n**Interview Context:**\nPosition: ${jobRole}`;
      if (experienceLevel) {
        const experienceLevels: Record<string, string> = {
          entry: '0-2 years',
          junior: '2-4 years',
          mid: '4-7 years',
          senior: '7-10 years',
          staff: '10+ years',
        };
        systemPrompt += `\nExperience Level: ${experienceLevel} (${experienceLevels[experienceLevel] || 'intermediate'})`;
        systemPrompt += `\n\nAdjust question difficulty and depth based on this experience level. ${
          experienceLevel === 'entry' ? 'Focus on fundamentals and learning attitude.' :
          experienceLevel === 'junior' ? 'Test practical knowledge and problem-solving.' :
          experienceLevel === 'mid' ? 'Expect good design decisions and trade-off discussions.' :
          experienceLevel === 'senior' ? 'Probe for leadership, architecture, and mentoring experience.' :
          'Expect expert-level insights, system thinking, and strategic vision.'
        }`;
      }
    }

    // Add specific topics if provided
    if (specificTopics) {
      systemPrompt += `\n\nFocus Areas: ${specificTopics}\nPrioritize questions related to these topics.`;
    }

    // Add resume context if provided
    if (resumeContext) {
      systemPrompt += `\n\nCandidate's Resume Summary:\n${resumeContext}\n\nTailor your questions based on their background and experience level mentioned in the resume.`;
    }

    // Add interview progress context
    const totalQuestions = {
      entry: 5,
      junior: 6,
      mid: 7,
      senior: 8,
      staff: 10,
    }[experienceLevel as string] || 5;

    systemPrompt += `\n\nCurrent Progress: Question ${currentQuestion} of ${totalQuestions}. ${
      currentQuestion === 1 ? 'Start with a warm-up question to make them comfortable.' :
      currentQuestion <= Math.floor(totalQuestions / 2) ? 'Increase difficulty gradually.' :
      currentQuestion < totalQuestions ? 'Ask challenging questions to test their limits.' :
      'Final question - make it comprehensive to assess overall capability.'
    }`;

    // Build conversation for AI
    const conversationMessages = history.slice(-10).map(msg => ({
      role: msg.role === 'interviewer' ? 'assistant' : 'user',
      content: msg.message,
    }));

    // Add system context to first message
    const aiMessages = [
      {
        role: 'user',
        content: `[System Instructions: ${systemPrompt}]\n\nCandidate: ${conversationMessages[conversationMessages.length - 1]?.content || message}`,
      },
      ...conversationMessages.slice(0, -1),
    ];

    // Call Perplexity AI
    const aiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning',
        messages: aiMessages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('Perplexity API error:', errorData);
      return NextResponse.json(
        { 
          success: false,
          message: 'Sorry, I encountered an error with the AI service. Please try again.',
        },
        { status: 200 }
      );
    }

    const aiData = await aiResponse.json();
    const fullResponse = aiData.choices?.[0]?.message?.content || 'I apologize, I need a moment to think. Could you rephrase that?';
    
    // Extract thinking/reasoning
    const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
    const reasoning = thinkMatch ? thinkMatch[1].trim() : null;

    // Remove <think> tags from message
    const aiMessage = fullResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Save AI response to transcript
    await db.insert(interviewTranscripts).values({
      interviewId,
      role: 'interviewer',
      message: aiMessage,
    });

    // Analyze the conversation to determine next steps
    const shouldProgress = currentQuestion < 5 && !aiMessage.toLowerCase().includes('final question');
    const isComplete = currentQuestion >= 5 || aiMessage.toLowerCase().includes('interview complete') || aiMessage.toLowerCase().includes('that concludes');

    // If interview is complete, generate feedback
    let feedback = null;
    if (isComplete) {
      feedback = await generateInterviewFeedback(interviewId, history, interviewType);
    }

    return NextResponse.json({
      success: true,
      message: aiMessage,
      reasoning,
      nextQuestion: shouldProgress,
      isComplete,
      feedback,
      currentQuestion: shouldProgress ? currentQuestion + 1 : currentQuestion,
    });

  } catch (error) {
    console.error('Error in interview chat:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sorry, I encountered an unexpected error. Please try again.',
      },
      { status: 200 }
    );
  }
}

// Generate comprehensive feedback at end of interview
async function generateInterviewFeedback(
  interviewId: string,
  history: InterviewTranscript[],
  interviewType: string
) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) return null;

    const transcript = history
      .map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.message}`)
      .join('\n\n');

    const feedbackPrompt = `You are an expert interviewer evaluating a ${interviewType} interview.

Analyze this interview transcript and provide:
1. Overall Score (0-100)
2. Three key strengths
3. Three areas for improvement
4. Specific feedback on:
   - Technical accuracy (if applicable)
   - Communication clarity
   - Problem-solving approach
   - Confidence level

Transcript:
${transcript}

Respond in JSON format:
{
  "score": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "feedback": "detailed paragraph of feedback"
}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: feedbackPrompt }],
        max_tokens: 1000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const feedbackText = data.choices?.[0]?.message?.content || '{}';
    
    // Try to parse JSON from response
    const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedFeedback = JSON.parse(jsonMatch[0]);
      return parsedFeedback;
    }

    return null;
  } catch (error) {
    console.error('Error generating feedback:', error);
    return null;
  }
}
