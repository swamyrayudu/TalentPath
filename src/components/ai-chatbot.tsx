'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, Loader2, Sparkles, User, ChevronDown, ChevronRight, Brain, MessageSquarePlus, Trash2, Menu } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function AIChatbot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m TalentPath AI — your friendly coding assistant. How can I help you with your coding journey today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Create a new conversation when user is logged in and starts chatting
  const createConversation = async (title = 'New Conversation') => {
    if (!session?.user?.id) return null;

    try {
      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const { conversation } = await response.json();
        // Refresh conversations list
        await loadConversations();
        return conversation.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  };

  // Load all conversations for the user
  const loadConversations = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/chat-history');
      if (response.ok) {
        const { conversations: convs } = await response.json();
        setConversations(convs || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for a specific conversation
  const loadConversation = async (conversationId: string) => {
    if (conversationId === currentConversationId) return; // Already loaded
    
    setIsLoadingConversation(true);
    setCurrentConversationId(conversationId);
    
    try {
      const response = await fetch(`/api/chat-history/${conversationId}`);
      if (!response.ok) {
        setIsLoadingConversation(false);
        return;
      }

      const { messages: loadedMessages } = await response.json();
      
      if (loadedMessages && loadedMessages.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedMessages: Message[] = loadedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          reasoning: msg.reasoning || undefined,
          isTyping: false,
        }));
        setMessages(formattedMessages);
      } else {
        // Empty conversation, show default greeting
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m TalentPath AI — your friendly coding assistant. How can I help you with your coding journey today?',
            timestamp: new Date(),
          },
        ]);
      }
      
      // Auto-close sidebar on mobile after selecting chat
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Start a new chat
  const startNewChat = async () => {
    // Immediately reset UI to a fresh conversation so previous messages are not shown
    const greeting: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m TalentPath AI — your friendly coding assistant. How can I help you with your coding journey today?',
      timestamp: new Date(),
    };

    setMessages([greeting]);
    setCurrentConversationId(null);

    // If the user is logged in, create a server-side conversation and store its id
    if (!session?.user?.id) return;

    try {
      const newConvId = await createConversation();
      if (newConvId) {
        setCurrentConversationId(newConvId);
      }
    } catch (error) {
      // creation failure shouldn't break UI — we'll keep the local cleared state
      console.error('Error creating new conversation:', error);
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch('/api/chat-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        await loadConversations();

        // If deleted current conversation, start new chat
        if (conversationId === currentConversationId) {
          await startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Auto-scroll during typing
  useEffect(() => {
    if (isLoading || isThinking) {
      scrollToBottom(true);
    }
  }, [messages, isLoading, isThinking]);

  // Load chat history when user opens chatbot
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!session?.user?.id || !isOpen) return;

      try {
        // Get user's conversations
        const conversationsResponse = await fetch('/api/chat-history');
        if (!conversationsResponse.ok) return;

        const { conversations } = await conversationsResponse.json();
        // populate the sidebar list so Chat History shows up
        setConversations(conversations || []);

        if (conversations && conversations.length > 0) {
          // Load most recent conversation
          const latestConversation = conversations[0];
          setCurrentConversationId(latestConversation.id);

          // Load messages for this conversation
          const messagesResponse = await fetch(`/api/chat-history/${latestConversation.id}`);
          if (!messagesResponse.ok) return;

          const { messages: loadedMessages } = await messagesResponse.json();
          
          if (loadedMessages && loadedMessages.length > 0) {
            // Convert database messages to component format
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedMessages: Message[] = loadedMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              reasoning: msg.reasoning || undefined,
              isTyping: false,
            }));

            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [session?.user?.id, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isLoadingConversation) {
      inputRef.current.focus();
    }
  }, [isOpen, isLoadingConversation]);

  // Track mobile breakpoint to switch sidebar behaviour
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    const chunkSize = 3; // Type multiple characters at once for better performance

    for (let i = 0; i < characters.length; i += chunkSize) {
      const chunk = characters.slice(i, i + chunkSize).join('');
      currentText += chunk;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentText, isTyping: true }
            : msg
        )
      );

      // Auto-scroll during typing
      requestAnimationFrame(() => scrollToBottom(true));

      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
    
    scrollToBottom(true);
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
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    // Create conversation if logged in and no conversation exists
    let convId = currentConversationId;
    if (session?.user?.id && !convId) {
      // Generate title from first message (truncated)
      const title = currentInput.length > 50 
        ? currentInput.substring(0, 50) + '...' 
        : currentInput;
      convId = await createConversation(title);
      setCurrentConversationId(convId);
    }

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
          conversationId: convId, // Include conversation ID
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
    // ESC to close sidebar
    if (e.key === 'Escape' && showSidebar) {
      setShowSidebar(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    // perform deletion
    await deleteConversation(conversationToDelete);
    setConversationToDelete(null);
    setDeleteDialogOpen(false);
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
        <div className="fixed inset-x-4 bottom-6 z-50 flex flex-col-reverse sm:flex-row items-end gap-2 sm:left-auto sm:right-6 space-y-3 sm:space-y-0">
          {/* Sidebar */}
          {/* Desktop / large screen sidebar */}
          {showSidebar && session?.user?.id && !isMobile && (
            <Card className="w-full sm:w-[280px] h-[60vh] sm:h-[700px] shadow-2xl border-2 border-amber-500/20 flex flex-col">
              <CardHeader className="border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white p-3">
                <CardTitle className="text-sm font-bold">Chat History</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                <Button
                  onClick={startNewChat}
                  className="w-full justify-start gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  size="sm"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  New Chat
                </Button>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors",
                      currentConversationId === conv.id && "bg-amber-100 dark:bg-gray-800",
                      isLoadingConversation && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {currentConversationId === conv.id && isLoadingConversation ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv.id); setDeleteDialogOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Chat */}
          <Card className="w-full sm:w-[450px] h-[70vh] sm:h-[700px] shadow-2xl border-2 border-amber-500/20 flex flex-col rounded-xl overflow-hidden">
            {/* Header */}
            <CardHeader className="border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  )}
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
                <div className="flex items-center gap-2">
                  {session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewChat}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      title="New Chat"
                    >
                      <MessageSquarePlus className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

          {/* Messages */}
          <CardContent 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-amber-50/30 to-orange-50/30 dark:from-gray-800 dark:to-gray-900 scroll-smooth"
          >
            {isLoadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <>
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
                <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
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
            </>
            )}
          </CardContent>

          {/* Input */}
          <div className="sticky bottom-0 z-20 border-t border-amber-500/10 bg-white dark:bg-gray-800 p-4">
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
                disabled={isLoading || isLoadingConversation}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 bg-white dark:bg-gray-800"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isLoadingConversation}
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

          {/* Mobile sidebar: show as bottom sheet/modal to avoid stacking under chat */}
          {showSidebar && session?.user?.id && isMobile && (
            <div className="fixed inset-0 z-60 flex items-end sm:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />
              <Card className="relative w-full max-h-[85vh] h-[85vh] shadow-2xl border-2 border-amber-500/20 flex flex-col rounded-t-xl">
                <CardHeader className="border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white p-3 flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Chat History</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)} className="text-white h-8 w-8 p-0">✕</Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                  <Button
                    onClick={() => { startNewChat(); setShowSidebar(false); }}
                    className="w-full justify-start gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    size="sm"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                  </Button>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors",
                        currentConversationId === conv.id && "bg-amber-100 dark:bg-gray-800",
                        isLoadingConversation && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => { loadConversation(conv.id); setShowSidebar(false); }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {currentConversationId === conv.id && isLoadingConversation ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setConversationToDelete(conv.id); setDeleteDialogOpen(true); }}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No conversations yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the conversation from your chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConversationToDelete(null); setDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
