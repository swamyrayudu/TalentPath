'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, Loader2, Sparkles, User, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import MarkdownMessage from '@/components/MarkdownMessage';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string;
  isTyping?: boolean;
};

export default function AIChatbot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Perplexity AI. How can I help you with your coding journey today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleThinking = (messageId: string) => {
    const newExpanded = new Set(expandedThinking);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThinking(newExpanded);
  };

  const typeMessage = async (messageId: string, fullText: string) => {
    const characters = fullText.split('');
    let currentText = '';

    for (let i = 0; i < characters.length; i++) {
      currentText += characters[i];
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentText, isTyping: true }
            : msg
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setIsThinking(false);

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        reasoning: data.reasoning,
        isTyping: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.message) {
        await typeMessage(assistantMessageId, data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsThinking(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[450px] h-[700px] shadow-2xl border-2 border-amber-500/20 flex flex-col">
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">TalentPath Assistant</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-amber-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-950">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-in fade-in slide-in-from-bottom-2',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'assistant'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 max-w-[80%]">
                  {/* Thinking Toggle Button */}
                  {message.reasoning && message.role === 'assistant' && !message.isTyping && (
                    <button
                      onClick={() => toggleThinking(message.id)}
                      className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs"
                    >
                      <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {expandedThinking.has(message.id) ? 'Hide thinking' : 'Show thinking'}
                      </span>
                      {expandedThinking.has(message.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}

                  {/* Thinking Content */}
                  {message.reasoning && expandedThinking.has(message.id) && (
                    <div className="mb-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                      <div className="flex items-center gap-2 mb-2 font-semibold text-amber-700 dark:text-amber-400">
                        <Brain className="w-4 h-4" />
                        <span>Thinking Process</span>
                      </div>
                      {message.reasoning}
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2 shadow-sm',
                      message.role === 'assistant'
                        ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                    )}
                  >
                    <div className="text-sm">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      {message.isTyping && (
                        <span className="inline-block w-0.5 h-4 ml-1 bg-amber-600 dark:bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-1 block',
                        message.role === 'assistant'
                          ? 'text-muted-foreground'
                          : 'text-white/70'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">Thinking...</span>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && !isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t  bg-white dark:bg-gray-900">
            {!session && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                Sign in to save your conversation history
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 bg-white dark:bg-gray-800"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
