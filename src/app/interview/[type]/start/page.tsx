'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import MarkdownMessage from '@/components/MarkdownMessage';
import ResumeUploader from '@/components/interview/resume-uploader';
import VoiceControls from '@/components/interview/voice-controls';
import CodingWorkspace from '@/components/interview/coding-workspace';

interface Message {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

interface Interview {
  id: string;
  type: string;
  difficulty: string;
  companyName?: string;
  status: string;
  duration: number;
  createdAt: string;
}

interface InterviewConfig {
  jobRole: string;
  experienceLevel: string;
  duration: number;
  companyName?: string;
  resumeText?: string;
  specificTopics?: string;
}

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const interviewType = params.type as string;
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [targetDuration, setTargetDuration] = useState<number | null>(null);
  const [resumeContext, setResumeContext] = useState('');
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [speakFunction, setSpeakFunction] = useState<((text: string) => void) | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load configuration and initialize interview
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // Load configuration from sessionStorage
    const savedConfig = sessionStorage.getItem('interviewConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig) as InterviewConfig;
        setConfig(parsedConfig);
        
        // Set total questions based on experience level
        const questionCount = {
          entry: 5,
          junior: 6,
          mid: 7,
          senior: 8,
          staff: 10,
        }[parsedConfig.experienceLevel] || 5;
        setTotalQuestions(questionCount);
        
        // Set target duration in seconds
        setTargetDuration(parsedConfig.duration * 60);
        
        // Set resume context if provided
        if (parsedConfig.resumeText) {
          setResumeContext(parsedConfig.resumeText);
        }
      } catch (error) {
        console.error('Failed to parse interview config:', error);
      }
    } else {
      // Redirect back to configure if no config found
      router.push(`/interview/${interviewType}/configure`);
      return;
    }

    initializeInterview();
  }, [authStatus, session, router, interviewType]);

  // Timer with auto-completion at target duration
  useEffect(() => {
    if (interview && interview.status === 'in-progress') {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          
          // Auto-complete interview when target duration is reached
          if (targetDuration && newTime >= targetDuration) {
            completeInterviewWithTimeout();
          }
          
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [interview, targetDuration]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak AI responses
  useEffect(() => {
    if (messages.length > 0 && speakFunction) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'interviewer') {
        speakFunction(lastMessage.content);
      }
    }
  }, [messages, speakFunction]);

  const initializeInterview = async () => {
    try {
      setIsInitializing(true);
      
      // Create new interview session
      const response = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: interviewType,
          difficulty: 'intermediate',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create interview:', errorData);
        throw new Error(errorData.error || 'Failed to create interview');
      }

      const data = await response.json();
      setInterview(data.interview);

      // Load transcript
      await loadTranscript(data.interview.id);
    } catch (error) {
      console.error('Error initializing interview:', error);
      alert(`Failed to start interview: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure you have run the database migration. Check the console for details.`);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadTranscript = async (interviewId: string) => {
    try {
      const response = await fetch(`/api/mock-interview/transcript?interviewId=${interviewId}`);
      if (!response.ok) throw new Error('Failed to load transcript');

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading transcript:', error);
    }
  };

  // Handle voice message submission
  const handleVoiceMessage = async (transcript: string) => {
    if (!transcript.trim() || !interview || isLoading) return;

    // Hide resume upload after first message
    if (showResumeUpload) {
      setShowResumeUpload(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'candidate',
      content: transcript.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatError(null);
    setIsLoading(true);

    try {
      // Send to AI for response with configuration context
      const response = await fetch('/api/mock-interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          message: transcript.trim(),
          currentQuestion,
          interviewType: interview.type,
          resumeContext: resumeContext || undefined,
          jobRole: config?.jobRole,
          experienceLevel: config?.experienceLevel,
          companyName: config?.companyName,
          specificTopics: config?.specificTopics,
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'interviewer',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Auto-speak AI response
      if (speakFunction) {
        speakFunction(data.message);
      }

      // Check if interview should progress
      if (data.nextQuestion) {
        setCurrentQuestion((prev) => prev + 1);
      }

      // Check if interview is complete
      if (data.isComplete && data.feedback) {
        await completeInterview(data.feedback);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatError('Connection issue while contacting the AI. Please wait a moment and try speaking again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeInterview = async (feedback: {
    score?: number;
    strengths?: string[];
    improvements?: string[];
    feedback?: string;
  }) => {
    if (!interview) return;

    try {
      setPerformanceScore(feedback.score || null);
      
      await fetch('/api/mock-interview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          status: 'completed',
          completedAt: new Date().toISOString(),
          ...feedback,
        }),
      });

      // Update local interview state
      setInterview({ ...interview, status: 'completed' });
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const completeInterviewWithTimeout = async () => {
    if (!interview || interview.status !== 'in-progress') return;

    // Add a timeout message
    const timeoutMessage: Message = {
      id: Date.now().toString(),
      role: 'interviewer',
      content: `⏰ **Time's Up!**\n\nThe ${targetDuration ? targetDuration / 60 : '?'}-minute interview session has ended. Let me provide you with feedback on your performance.\n\nGenerating your performance report...`,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, timeoutMessage]);
    
    // Speak the timeout message
    if (speakFunction) {
      speakFunction("Time's up! The interview session has ended. Let me provide feedback on your performance.");
    }

    // Request AI feedback
    try {
      const response = await fetch('/api/mock-interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          message: 'TIME_LIMIT_REACHED',
          currentQuestion,
          interviewType: interview.type,
          isTimeout: true,
          resumeContext: resumeContext || undefined,
          jobRole: config?.jobRole,
          experienceLevel: config?.experienceLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isComplete && data.feedback) {
          await completeInterview(data.feedback);
        }
      }
    } catch (error) {
      console.error('Error getting timeout feedback:', error);
      // Complete without detailed feedback
      await completeInterview({ score: 70, feedback: 'Interview completed at time limit.' });
    }
  };

  const handleEndInterview = () => {
    router.push('/interview');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isInitializing || authStatus === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <p className="text-sm text-muted-foreground">Setting up your interview…</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 py-20 md:px-6">
          <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <AlertCircle className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h1 className="mt-4 text-sm font-semibold tracking-tight">
              Could not start the interview
            </h1>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              The session failed to initialise. Try again from the interview list.
            </p>
            <Button variant="outline" className="mt-5 gap-2" onClick={() => router.push('/interview')}>
              <ArrowLeft className="size-4" />
              All interviews
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (currentQuestion / totalQuestions) * 100;
  const typeLabel = interview.type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Header */}
        <button
          onClick={handleEndInterview}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Exit interview
        </button>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {typeLabel} interview
            </h1>
            {config && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{config.jobRole}</Badge>
                <Badge variant="outline" className="capitalize">
                  {config.experienceLevel}
                </Badge>
                {config.companyName && (
                  <Badge variant="outline">{config.companyName}</Badge>
                )}
                <Badge variant="outline">{config.duration} min</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 rounded-2xl border bg-card px-5 py-3.5">
            <div>
              <p className="text-xs text-muted-foreground">Elapsed</p>
              <p className="mt-1 inline-flex items-baseline gap-1.5 font-mono text-lg font-semibold tabular-nums">
                {formatTime(elapsedTime)}
                {targetDuration && (
                  <span className="text-xs font-normal text-muted-foreground">
                    / {formatTime(targetDuration)}
                  </span>
                )}
              </p>
            </div>
            <div className="min-w-[120px] border-l pl-6">
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {currentQuestion}/{totalQuestions}
              </p>
              <Progress value={progress} className="mt-2 h-1" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {/* Voice + resume */}
          <div className="space-y-4">
            <section className="rounded-2xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight">Voice link</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Speak naturally — pauses are detected automatically.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <VoiceControls
                  onTranscriptChange={(text) => {
                    if (text.trim()) {
                      handleVoiceMessage(text);
                    }
                  }}
                  onSpeakMessage={(speakFn) => setSpeakFunction(() => speakFn)}
                  disabled={isLoading || interview?.status === 'completed'}
                />
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>Speak after the tone.</li>
                  <li>Toggle the switch to pause or resume.</li>
                  <li>Everything is transcribed and saved.</li>
                </ul>
              </div>
            </section>

            {showResumeUpload ? (
              <ResumeUploader onResumeExtracted={(text) => setResumeContext(text)} />
            ) : (
              resumeContext && (
                <section className="rounded-2xl border bg-card p-5">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Resume context active
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    {resumeContext.length} characters shaping your questions.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowResumeUpload(true)}
                  >
                    Update resume
                  </Button>
                </section>
              )
            )}
          </div>

          {/* Conversation */}
          <div className="space-y-4 xl:col-span-3">
            {chatError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-5 py-3.5">
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" strokeWidth={1.75} />
                  {chatError}
                </p>
              </div>
            )}

            <section className="rounded-2xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight">Conversation</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Interviewer prompts only — your answers are captured by voice.
                </p>
              </div>

              <div
                className="space-y-3 overflow-y-auto p-5"
                style={{ maxHeight: '520px' }}
              >
                {messages
                  .filter((msg) => msg.role === 'interviewer')
                  .map((msg) => (
                    <div key={msg.id} className="rounded-xl border p-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        AI interviewer
                      </p>
                      <MarkdownMessage content={msg.content} />
                    </div>
                  ))}

                {isLoading && (
                  <div className="rounded-xl border p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Thinking…
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </section>

            {interview.type === 'dsa-coding' && <CodingWorkspace />}
          </div>
        </div>

        {/* Completed */}
        {interview.status === 'completed' && performanceScore !== null && (
          <section className="mt-6 rounded-2xl border bg-card p-8 text-center">
            <CheckCircle2
              className="mx-auto size-6 text-emerald-500"
              strokeWidth={1.75}
            />
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              Interview complete
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your full transcript and feedback are above.
            </p>

            <p className="mt-8 text-5xl font-semibold tracking-tight tabular-nums">
              {performanceScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Overall score</p>

            <div className="mt-8 flex justify-center gap-2">
              <Button className="gap-2" onClick={() => router.push('/interview')}>
                <ArrowLeft className="size-4" />
                All interviews
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Export report
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
