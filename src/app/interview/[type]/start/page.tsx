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
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={handleEndInterview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              End Interview
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {formatTime(elapsedTime)}
                  {targetDuration && ` / ${formatTime(targetDuration)}`}
                </span>
              </div>
              
              <Badge variant="outline">
                Question {currentQuestion} of {totalQuestions}
              </Badge>
            </div>
          </div>

          {config && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="secondary">{config.jobRole}</Badge>
                <Badge variant="outline">{config.experienceLevel}</Badge>
                {config.companyName && <Badge variant="outline">{config.companyName}</Badge>}
                <span className="text-muted-foreground">
                  Target: {config.duration} minutes
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Interview Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Upload Sidebar */}
          {showResumeUpload && (
            <div className="lg:col-span-1">
              <ResumeUploader
                onResumeExtracted={(text) => setResumeContext(text)}
              />
              
              {resumeContext && (
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm mb-1">AI Personalization</h4>
                        <p className="text-xs text-muted-foreground">
                          Questions will be tailored to your {resumeContext.length > 500 ? 'extensive' : ''} experience and skills
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className={showResumeUpload ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {/* Voice Controls */}
            <div className="mb-4">
              <VoiceControls
                onTranscriptChange={(text) => {
                  // Auto-submit when user finishes speaking
                  if (text.trim()) {
                    handleVoiceMessage(text);
                  }
                }}
                onSpeakMessage={(speakFn) => setSpeakFunction(() => speakFn)}
                disabled={isLoading || interview?.status === 'completed'}
              />
            </div>

              {chatError && (
                <Card className="mb-4 border-destructive/50 bg-destructive/5">
                  <CardContent className="py-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {chatError}
                  </CardContent>
                </Card>
              )}

              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mock Interview - {interview.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 pr-2">
                  {messages
                    .filter((msg) => msg.role === 'interviewer')
                    .map((msg) => (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[85%] rounded-lg bg-muted p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            <span className="text-xs font-medium opacity-70">AI Interviewer</span>
                          </div>
                          <MarkdownMessage content={msg.content} />
                        </div>
                      </div>
                    ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice-Only Instructions */}
            {interview.status === 'in-progress' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-2">Voice Interview Mode</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Voice mode stays connected at all times—just start speaking and the AI will reply instantly.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Use the toggle to pause or resume the live connection</li>
                      <li>• AI responses will be spoken automatically</li>
                      <li>• Adjust voice settings (speed, pitch) using the settings icon</li>
                      <li>• All conversations are transcribed and saved</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

        {interview.type === 'dsa-coding' && (
          <div className="mt-6">
            <CodingWorkspace />
          </div>
        )}

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