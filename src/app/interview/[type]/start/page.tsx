'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Loader2,
  Clock,
  Brain,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Initializing interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Failed to Start Interview</h2>
            <p className="text-muted-foreground mb-6">
              Unable to initialize the interview session
            </p>
            <Button onClick={() => router.push('/interview')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Card className="border shadow-md bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
          <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button variant="ghost" size="sm" onClick={handleEndInterview} className="-ml-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Exit Interview
                </Button>
              </div>
              <CardTitle className="text-2xl font-semibold">
                Live {interview.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Interview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Stay connected with the AI interviewer while we track your progress and timebox the session.
              </p>
              {config && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{config.jobRole}</Badge>
                  <Badge variant="outline">{config.experienceLevel}</Badge>
                  {config.companyName && <Badge variant="outline">{config.companyName}</Badge>}
                  <Badge variant="outline">{config.duration} min session</Badge>
                </div>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-3 rounded-xl border bg-background/80 p-4 text-center text-xs md:text-sm lg:w-auto lg:min-w-[340px] lg:text-left">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-muted-foreground">Time Elapsed</p>
                <div className="mt-1 flex items-baseline gap-2 font-mono text-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(elapsedTime)}</span>
                  {targetDuration && <span className="text-xs text-muted-foreground">/ {formatTime(targetDuration)}</span>}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-muted-foreground">Question Progress</p>
                <div className="mt-1 text-lg font-semibold">
                  {currentQuestion}/{totalQuestions}
                </div>
                <Progress value={progress} className="mt-2 h-1.5" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-4">
          <div className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" />
                  Voice Link
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Always-on voice mode keeps the interviewer connected. Just speak naturally when you&apos;re ready.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <VoiceControls
                  onTranscriptChange={(text) => {
                    if (text.trim()) {
                      handleVoiceMessage(text);
                    }
                  }}
                  onSpeakMessage={(speakFn) => setSpeakFunction(() => speakFn)}
                  disabled={isLoading || interview?.status === 'completed'}
                />
                <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-sm text-foreground">Voice etiquette</p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Speak after the tone; the AI auto-detects pauses.</li>
                    <li>• Toggle the switch above to pause/resume the call.</li>
                    <li>• Use settings to adjust voice, rate, or pitch.</li>
                    <li>• Everything is transcribed and saved automatically.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {showResumeUpload ? (
              <ResumeUploader
                onResumeExtracted={(text) => setResumeContext(text)}
                className="border shadow-sm"
              />
            ) : (
              resumeContext && (
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">AI Personalization Active</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Resume insights are shaping follow-up questions and feedback.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 text-xs">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">{resumeContext.length} characters of context</p>
                        <p className="text-muted-foreground">Project highlights and experience influence every question.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowResumeUpload(true)}>
                      Update resume context
                    </Button>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="space-y-4 xl:col-span-3">
            {chatError && (
              <Card className="border-destructive/50 bg-destructive/5 text-sm text-destructive">
                <CardContent className="flex items-center gap-2 py-3">
                  <AlertCircle className="h-4 w-4" />
                  {chatError}
                </CardContent>
              </Card>
            )}

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Conversation Log
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Only interviewer responses are shown to keep the interface focused.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '520px' }}>
                  {messages
                    .filter((msg) => msg.role === 'interviewer')
                    .map((msg) => (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[85%] rounded-lg border bg-muted/80 p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Brain className="h-4 w-4 text-primary" />
                            AI Interviewer
                          </div>
                          <MarkdownMessage content={msg.content} />
                        </div>
                      </div>
                    ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-lg border bg-muted/60 p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          AI is thinking...
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>

            {interview.type === 'dsa-coding' && (
              <CodingWorkspace className="border shadow-sm" />
            )}
          </div>
        </div>

        {/* Interview Completed */}
        {interview.status === 'completed' && performanceScore !== null && (
          <Card className="border-green-500 mt-6">
            <CardContent className="py-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Interview Completed!</h3>
                  <p className="text-muted-foreground mb-4">
                    Great job! Review your performance summary below
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-4xl font-bold text-primary">{performanceScore}</span>
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 text-center">
                    Full Transcript Available
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Review your answers and AI feedback below
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => router.push('/interview')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Interviews
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      Export Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}