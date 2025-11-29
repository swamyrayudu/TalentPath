'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Send, Bot, Loader2, User, ChevronDown, ChevronRight, Brain, MessageSquarePlus, Trash2, Menu, MessageCircle } from 'lucide-react';
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
  const pathname = usePathname();
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
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

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

  // Start a new chat - just reset UI, don't create server conversation yet
  const startNewChat = () => {
    // Reset UI to a fresh conversation so previous messages are not shown
    const greeting: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m TalentPath AI — your friendly coding assistant. How can I help you with your coding journey today?',
      timestamp: new Date(),
    };

    setMessages([greeting]);
    setCurrentConversationId(null);
    // Conversation will be created when user sends first message
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
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Clear all conversations
  const clearAllConversations = async () => {
    if (!session?.user?.id || conversations.length === 0) return;

    try {
      // Delete all conversations one by one
      for (const conv of conversations) {
        await fetch('/api/chat-history', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: conv.id }),
        });
      }
      
      // Clear the list and start fresh
      setConversations([]);
      startNewChat();
    } catch (error) {
      console.error('Error clearing all conversations:', error);
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
      
      // Only load history once per session
      if (hasLoadedHistory.current) return;
      hasLoadedHistory.current = true;

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
        // If no conversations exist, just show the default greeting (no new conversation created)
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

  const handleConfirmClearAll = async () => {
    await clearAllConversations();
    setClearAllDialogOpen(false);
  };

  // Hide chatbot on contest and aptitude pages
  const shouldHideChatbot = pathname?.startsWith('/contest') || pathname?.startsWith('/aptitude');

  if (shouldHideChatbot) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            // Don't create new chat here - just open the chatbot
            // Chat history will be loaded by the useEffect
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-6 z-50 flex flex-col-reverse sm:flex-row items-end gap-2 sm:left-auto sm:right-6 space-y-3 sm:space-y-0">
            {/* Sidebar */}
          {/* Desktop / large screen sidebar */}
          {showSidebar && session?.user?.id && !isMobile && (
            <Card className="w-full sm:w-[280px] h-[60vh] sm:h-[700px] shadow-lg border flex flex-col">
              <CardHeader className="border-b bg-muted p-3">
                <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={startNewChat}
                    className="flex-1 justify-center gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                  </Button>
                  {conversations.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setClearAllDialogOpen(true)}
                      className="px-2"
                      title="Clear all chats"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                      currentConversationId === conv.id && "bg-accent",
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
          <Card className="w-full sm:w-[450px] h-[80vh] sm:h-[700px] shadow-lg border flex flex-col rounded-lg overflow-hidden">
            {/* Header */}
            <CardHeader className="border-b p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="h-8 w-8 p-0"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewChat}
                      className="h-8 w-8 p-0"
                      title="New Chat"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

          {/* Messages */}
          <CardContent 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-3 space-y-3 scroll-smooth overscroll-contain"
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
                    'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'assistant'
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
                  )}
                </div>
                <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                  {/* Thinking Toggle Button */}
                  {message.reasoning && message.role === 'assistant' && !message.isTyping && (
                    <button
                      onClick={() => toggleThinking(message.id)}
                      className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent transition-colors text-xs"
                    >
                      <Brain className="w-4 h-4 text-primary" />
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
                    <div className="mb-3 p-3 bg-muted border rounded-lg text-xs whitespace-pre-wrap break-words leading-relaxed">
                      <div className="flex items-center gap-2 mb-2 font-semibold text-primary">
                        <Brain className="w-4 h-4" />
                        <span>Thinking Process</span>
                      </div>
                      {message.reasoning}
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={cn(
                      'rounded-lg px-2 py-1.5 sm:px-3 sm:py-2',
                      message.role === 'assistant'
                        ? 'bg-muted border'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <div className="text-xs sm:text-sm">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      {message.isTyping && (
                        <span className="inline-block w-0.5 h-4 ml-1 bg-amber-600 dark:bg-amber-400" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs mt-1 block',
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
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-2 bg-muted border rounded-lg px-3 py-2 text-sm">
                  <Brain className="w-4 h-4" />
                  <span className="font-medium">Thinking...</span>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && !isThinking && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted border rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </>
            )}
          </CardContent>

          {/* Input */}
          <div className="sticky bottom-0 z-20 border-t px-3 py-2">
            {!session && (
              <div className="mb-2 p-2 bg-muted border rounded-lg text-xs">
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
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 bg-background"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isLoadingConversation}
                size="sm"
                className="rounded-lg w-9 h-9 p-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          </Card>

          {/* Mobile sidebar: show as bottom sheet/modal to avoid stacking under chat */}
          {showSidebar && session?.user?.id && isMobile && (
            <div className="fixed inset-0 z-60 flex items-end sm:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />
              <Card className="relative w-full max-h-[85vh] h-[85vh] shadow-lg border flex flex-col rounded-t-xl">
                <CardHeader className="border-b bg-muted p-3 flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)} className="h-8 w-8 p-0">✕</Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                  <Button
                    onClick={() => { startNewChat(); setShowSidebar(false); }}
                    className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                  </Button>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                        currentConversationId === conv.id && "bg-accent",
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
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
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
        </>
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

      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} from your chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClearAll} className="bg-red-600 hover:bg-red-700">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
