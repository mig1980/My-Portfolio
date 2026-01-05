/**
 * @fileoverview Floating AI chat widget component.
 * @description Provides an interactive chat interface for portfolio visitors.
 * Features: typing animation, timestamps, AI disclaimer, localStorage persistence.
 * @author Michael Gavrilov
 * @version 1.2.0
 */

import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { ChatMessage } from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum input length (aligned with backend) */
const MAX_INPUT_LENGTH = 500;

/** Typing animation speed (ms per character) - respects prefers-reduced-motion */
const TYPING_SPEED_MS = 12;

/** Suggested questions for new users */
const QUICK_QUESTIONS: readonly string[] = [
  "What is Michael's experience?",
  'Key achievements?',
  'Current role?',
] as const;

/** Greeting bubble configuration */
const GREETING_BUBBLE = {
  /** Delay before showing bubble (ms) */
  SHOW_DELAY_MS: 3000,
  /** Auto-hide after this duration (ms) - 0 to disable */
  AUTO_HIDE_MS: 15000,
  /** localStorage key for tracking dismissal */
  STORAGE_KEY: 'aboutme-greeting-dismissed',
  /** Greeting message text */
  MESSAGE: "👋 Hi! Ask me anything about Michael's experience",
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a timestamp for display.
 * Shows relative time for recent messages, full time for older ones.
 * @param date - The date to format
 * @returns Formatted string
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Guard against future dates (e.g., clock skew)
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Just now (< 1 minute)
  if (diffMins < 1) {
    return 'Just now';
  }

  // Minutes ago (< 60 minutes)
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Full date for older messages
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================================================
// Sub-Components
// ============================================================================

/** Props for MessageBubble component */
interface MessageBubbleProps {
  message: ChatMessage;
  isLatestAssistant?: boolean;
  onTypingComplete?: () => void;
}

/**
 * Hook for typing animation effect.
 * Respects prefers-reduced-motion preference.
 */
function useTypingAnimation(
  content: string,
  shouldAnimate: boolean,
  onComplete?: () => void
): { displayedText: string; isTyping: boolean } {
  const [displayedText, setDisplayedText] = useState<string>(shouldAnimate ? '' : content);
  const [isTyping, setIsTyping] = useState<boolean>(shouldAnimate);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    // Skip animation if not needed or user prefers reduced motion
    if (!shouldAnimate || prefersReducedMotion) {
      setDisplayedText(content);
      setIsTyping(false);
      onComplete?.();
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const intervalId = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
        onComplete?.();
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [content, shouldAnimate, prefersReducedMotion, onComplete]);

  return { displayedText, isTyping };
}

/**
 * Individual message bubble component with optional typing animation.
 * Memoized to prevent unnecessary re-renders.
 */
const MessageBubble = memo<MessageBubbleProps>(
  ({ message, isLatestAssistant = false, onTypingComplete }) => {
    const isUser = message.role === 'user';

    // Only animate the latest assistant message
    const shouldAnimate = !isUser && isLatestAssistant;
    const { displayedText, isTyping } = useTypingAnimation(
      message.content,
      shouldAnimate,
      onTypingComplete
    );

    // Format timestamp for display
    const formattedTime = useMemo(() => formatTimestamp(message.timestamp), [message.timestamp]);

    return (
      <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`} role="article">
        {/* Assistant Avatar */}
        {!isUser && (
          <div
            className="w-7 h-7 rounded-full bg-primary-600 flex items-center 
                     justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Message Content */}
        <div className="flex flex-col max-w-[80%]">
          {/* Message Bubble */}
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-slate-800 text-slate-200 rounded-bl-md'
            }`}
          >
            {isUser ? message.content : displayedText}
            {/* Typing cursor for animation effect */}
            {isTyping && (
              <span
                className="inline-block w-0.5 h-4 bg-primary-400 ml-0.5 animate-pulse"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Timestamp */}
          <span
            className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}
            aria-label={`Sent ${formattedTime}`}
          >
            {formattedTime}
          </span>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div
            className="w-7 h-7 rounded-full bg-slate-700 flex items-center 
                     justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <User className="w-4 h-4 text-slate-300" />
          </div>
        )}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

/**
 * Loading indicator with animated dots.
 * Respects prefers-reduced-motion.
 */
const LoadingIndicator = memo(() => (
  <div className="flex gap-2 justify-start" role="status">
    <div
      className="w-7 h-7 rounded-full bg-primary-600 flex items-center 
                 justify-center flex-shrink-0"
      aria-hidden="true"
    >
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
      <div
        className="flex gap-1.5 motion-reduce:hidden"
        role="status"
        aria-label="Loading response"
      >
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce animation-delay-150" />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce animation-delay-300" />
      </div>
      {/* Fallback for reduced motion */}
      <span className="hidden motion-reduce:block text-slate-400 text-sm">Thinking...</span>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

/**
 * AI Disclaimer footer component.
 * Provides transparency about AI-generated responses.
 */
const AiDisclaimer = memo(() => (
  <div
    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/50 
               border-t border-slate-700/50 text-xs text-slate-500"
    aria-label="Disclaimer"
  >
    <Sparkles className="w-3 h-3" aria-hidden="true" />
    <span>Powered by AI · Responses may not be 100% accurate</span>
  </div>
));

AiDisclaimer.displayName = 'AiDisclaimer';

/** Props for OfflineIndicator component */
interface OfflineIndicatorProps {
  isFullscreen?: boolean;
}

/**
 * Offline status indicator.
 * Shows when the browser is disconnected from the network.
 */
const OfflineIndicator = memo<OfflineIndicatorProps>(({ isFullscreen = false }) => (
  <div
    className={`flex items-center justify-center gap-2 px-3 py-2 bg-amber-900/30 
               border-t border-amber-700/50 text-xs text-amber-400
               ${isFullscreen ? 'py-3' : ''}`}
    role="status"
    aria-live="polite"
  >
    <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
    <span>You&apos;re offline. Reconnect to send messages.</span>
  </div>
));

OfflineIndicator.displayName = 'OfflineIndicator';

/** Props for RateLimitIndicator component */
interface RateLimitIndicatorProps {
  secondsRemaining: number;
  isFullscreen?: boolean;
}

/**
 * Rate limit indicator with countdown.
 * Shows progress bar and time remaining.
 */
const RateLimitIndicator = memo<RateLimitIndicatorProps>(
  ({ secondsRemaining, isFullscreen = false }) => {
    // Calculate progress percentage (30 seconds max)
    const maxSeconds = 30;
    const progress = ((maxSeconds - secondsRemaining) / maxSeconds) * 100;

    return (
      <div
        className={`px-3 py-2 bg-amber-900/30 border-t border-amber-700/50 
                   ${isFullscreen ? 'py-3' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between text-xs text-amber-400 mb-1.5">
          <span>Rate limit - please wait</span>
          <span className="font-mono">{secondsRemaining}s</span>
        </div>
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }
);

RateLimitIndicator.displayName = 'RateLimitIndicator';

/** Props for FollowUpSuggestions component */
interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

/**
 * Follow-up question suggestion chips.
 * Displayed after AI responses to guide conversation.
 */
const FollowUpSuggestions = memo<FollowUpSuggestionsProps>(
  ({ suggestions, onSelect, disabled = false }) => {
    if (suggestions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3 justify-start">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 
                     text-primary-300 text-xs rounded-full transition-colors 
                     focus-ring border border-primary-600/30
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  }
);

FollowUpSuggestions.displayName = 'FollowUpSuggestions';

/** Props for RetryButton component */
interface RetryButtonProps {
  onRetry: () => void;
  disabled?: boolean;
}

/**
 * Retry button for failed messages.
 */
const RetryButton = memo<RetryButtonProps>(({ onRetry, disabled = false }) => (
  <button
    type="button"
    onClick={onRetry}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2
               bg-slate-700 hover:bg-slate-600 text-slate-200 
               text-xs rounded-lg transition-colors focus-ring
               disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label="Retry sending message"
  >
    <RefreshCw className="w-3 h-3" aria-hidden="true" />
    <span>Retry</span>
  </button>
));

RetryButton.displayName = 'RetryButton';

/** Props for GreetingBubble component */
interface GreetingBubbleProps {
  onDismiss: () => void;
  onClick: () => void;
}

/**
 * Animated greeting bubble to attract attention to the chat.
 * Shows after a delay for first-time visitors.
 */
const GreetingBubble = memo<GreetingBubbleProps>(({ onDismiss, onClick }) => (
  <div
    className="fixed bottom-24 left-6 z-40 max-w-[280px]
               motion-safe:animate-[fadeSlideIn_0.3s_ease-out]"
    role="status"
    aria-live="polite"
  >
    {/* Speech bubble with tail */}
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white text-slate-800 px-4 py-3 rounded-2xl 
                   shadow-lg hover:shadow-xl transition-shadow cursor-pointer
                   focus-ring"
        aria-label="Open chat assistant"
      >
        <p className="text-sm font-medium leading-relaxed">{GREETING_BUBBLE.MESSAGE}</p>
      </button>
      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-slate-600
                   text-white rounded-full flex items-center justify-center
                   shadow-md transition-colors focus-ring"
        aria-label="Dismiss greeting"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {/* Bubble tail pointing to chat button */}
      <div
        className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45"
        aria-hidden="true"
      />
    </div>
  </div>
));

GreetingBubble.displayName = 'GreetingBubble';

// ============================================================================
// Main Component
// ============================================================================

/**
 * Floating chat widget for AI-powered Q&A about Michael's background.
 * Features a collapsible interface with message history and quick suggestions.
 *
 * @remarks
 * - Positioned bottom-left to avoid conflict with BackToTop button (bottom-right)
 * - Supports keyboard navigation (Tab, Enter, Escape)
 * - Respects prefers-reduced-motion
 * - Full accessibility with ARIA labels and live regions
 */
const ChatWidget: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [isTypingAnimation, setIsTypingAnimation] = useState<boolean>(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState<boolean>(false);
  const {
    messages,
    isLoading,
    error,
    isRateLimited,
    rateLimitSecondsRemaining,
    suggestions,
    failedMessage,
    sendMessage,
    retryLastMessage,
    clearHistory,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greetingTimersRef = useRef<{
    show: ReturnType<typeof setTimeout> | null;
    hide: ReturnType<typeof setTimeout> | null;
  }>({ show: null, hide: null });

  // Mobile responsiveness
  const isMobile = useIsMobile();
  const isFullscreen = isMobile && isOpen;

  // Online status
  const isOnline = useOnlineStatus();

  // Lock body scroll when fullscreen on mobile
  useBodyScrollLock(isFullscreen);

  // ============================================================================
  // Greeting Bubble Logic
  // ============================================================================

  /**
   * Check if greeting was previously dismissed (stored in localStorage).
   * Returns true if user has dismissed or interacted with chat before.
   */
  const wasGreetingDismissed = useCallback((): boolean => {
    try {
      const dismissed = localStorage.getItem(GREETING_BUBBLE.STORAGE_KEY);
      return dismissed === 'true';
    } catch {
      // localStorage not available (SSR, private browsing, etc.)
      return false;
    }
  }, []);

  /**
   * Mark greeting as dismissed in localStorage.
   */
  const markGreetingDismissed = useCallback((): void => {
    try {
      localStorage.setItem(GREETING_BUBBLE.STORAGE_KEY, 'true');
    } catch {
      // Silently fail if localStorage unavailable
    }
  }, []);

  /**
   * Dismiss the greeting bubble and remember the dismissal.
   */
  const dismissGreeting = useCallback((): void => {
    setShowGreetingBubble(false);
    markGreetingDismissed();

    // Clear auto-hide timer if set
    if (greetingTimersRef.current.hide) {
      clearTimeout(greetingTimersRef.current.hide);
      greetingTimersRef.current.hide = null;
    }
  }, [markGreetingDismissed]);

  /**
   * Handle greeting bubble click - open chat and dismiss greeting.
   */
  const handleGreetingClick = useCallback((): void => {
    setIsOpen(true);
    dismissGreeting();
  }, [dismissGreeting]);

  // Show greeting bubble after delay for first-time visitors
  useEffect(() => {
    // Don't show if: already dismissed, chat is open, or already showing
    if (wasGreetingDismissed() || isOpen) {
      return;
    }

    // Capture ref values for cleanup
    const timers = greetingTimersRef.current;

    // Show after delay
    timers.show = setTimeout(() => {
      // Double-check chat isn't open (user might have opened during delay)
      if (!isOpen) {
        setShowGreetingBubble(true);

        // Auto-hide after duration (if configured)
        if (GREETING_BUBBLE.AUTO_HIDE_MS > 0) {
          timers.hide = setTimeout(() => {
            setShowGreetingBubble(false);
            // Don't mark as dismissed on auto-hide - show again on next visit
          }, GREETING_BUBBLE.AUTO_HIDE_MS);
        }
      }
    }, GREETING_BUBBLE.SHOW_DELAY_MS);

    // Cleanup timers on unmount
    return () => {
      if (timers.show) {
        clearTimeout(timers.show);
      }
      if (timers.hide) {
        clearTimeout(timers.hide);
      }
    };
  }, [isOpen, wasGreetingDismissed]);

  // Hide greeting when chat opens
  useEffect(() => {
    if (isOpen && showGreetingBubble) {
      dismissGreeting();
    }
  }, [isOpen, showGreetingBubble, dismissGreeting]);

  // Find the latest assistant message ID for typing animation
  const latestAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && msg.role === 'assistant') {
        return msg.id;
      }
    }
    return null;
  }, [messages]);

  // Track when a new assistant message arrives for typing animation
  const prevMessagesLengthRef = useRef<number>(0);
  useEffect(() => {
    const currentLength = messages.length;
    const lastMessage = messages[currentLength - 1];

    // Start typing animation when a new assistant message arrives
    if (currentLength > prevMessagesLengthRef.current && lastMessage?.role === 'assistant') {
      setIsTypingAnimation(true);
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messages]);

  // Callback when typing animation completes
  const handleTypingComplete = useCallback(() => {
    setIsTypingAnimation(false);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;

    // Small delay to ensure animation completes
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!input.trim() || isLoading || isRateLimited || !isOnline) return;

      const message = input;
      setInput('');
      await sendMessage(message);
    },
    [input, isLoading, isRateLimited, isOnline, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleQuickQuestion = useCallback(
    (question: string): void => {
      if (!isOnline) return;
      void sendMessage(question);
    },
    [sendMessage, isOnline]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string): void => {
      if (!isOnline) return;
      void sendMessage(suggestion);
    },
    [sendMessage, isOnline]
  );

  const handleRetry = useCallback((): void => {
    if (!isOnline) return;
    void retryLastMessage();
  }, [retryLastMessage, isOnline]);

  const toggleChat = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  }, []);

  const handleClearHistory = useCallback((): void => {
    clearHistory();
  }, [clearHistory]);

  return (
    <>
      {/* Greeting Bubble - shows after delay for first-time visitors */}
      {showGreetingBubble && !isOpen && !isFullscreen && (
        <GreetingBubble onDismiss={dismissGreeting} onClick={handleGreetingClick} />
      )}

      {/* Floating Toggle Button - hidden when fullscreen on mobile */}
      {!isFullscreen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 
                     text-white rounded-full shadow-lg flex items-center justify-center 
                     transition-all duration-150 hover:scale-110 focus-ring
                     motion-reduce:transition-none motion-reduce:hover:transform-none"
          aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
          aria-expanded={isOpen}
          aria-controls="chat-dialog"
        >
          {isOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-dialog"
          className={`fixed z-50 bg-slate-900 flex flex-col overflow-hidden
                      motion-safe:animate-[slideUp_0.2s_ease-out]
                      ${
                        isFullscreen
                          ? 'inset-0 rounded-none border-0'
                          : 'bottom-24 left-6 w-[380px] max-w-[calc(100vw-48px)] border border-slate-700 rounded-2xl shadow-2xl'
                      }`}
          style={{
            height: isFullscreen ? '100%' : 'min(520px, calc(100vh - 150px))',
            // Safe area insets for notched devices
            paddingTop: isFullscreen ? 'env(safe-area-inset-top, 0px)' : undefined,
            paddingBottom: isFullscreen ? 'env(safe-area-inset-bottom, 0px)' : undefined,
            paddingLeft: isFullscreen ? 'env(safe-area-inset-left, 0px)' : undefined,
            paddingRight: isFullscreen ? 'env(safe-area-inset-right, 0px)' : undefined,
          }}
          role="dialog"
          aria-label="AI Assistant Chat"
          aria-describedby="chat-description"
          aria-modal="true"
        >
          {/* Screen reader description */}
          <span id="chat-description" className="sr-only">
            Chat with an AI assistant about Michael&apos;s professional background
          </span>

          {/* Header */}
          <div
            className={`bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 
                       flex items-center justify-between flex-shrink-0
                       ${isFullscreen ? 'pt-0 py-4' : ''}`}
          >
            <div className="flex items-center gap-2">
              {/* Close button for mobile fullscreen - positioned first for easy thumb reach */}
              {isFullscreen && (
                <button
                  onClick={toggleChat}
                  className="p-2 -ml-2 mr-1 text-white hover:bg-white/10 
                             rounded-lg transition-colors focus-ring"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">AI Assistant</h2>
                <p className="text-primary-200 text-xs">Ask about Michael</p>
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              className="p-2 text-primary-200 hover:text-white hover:bg-white/10 
                         rounded-lg transition-colors focus-ring
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Clear chat history"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            role="log"
            aria-label="Chat messages"
            data-scroll-container
            data-block-swipe="true"
          >
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center 
                             justify-center mx-auto mb-4"
                >
                  <Bot className="w-8 h-8 text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="text-slate-200 font-medium mb-2">
                  Hi! I&apos;m Michael&apos;s AI assistant
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Ask me anything about Michael&apos;s professional background, experience, or
                  skills.
                </p>

                {/* Quick Questions */}
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Quick questions</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleQuickQuestion(question)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 
                                   text-xs rounded-full transition-colors focus-ring"
                        disabled={isLoading || isRateLimited || !isOnline}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            <div aria-live="polite" aria-atomic="false" aria-relevant="additions">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLatestAssistant={message.id === latestAssistantMessageId && isTypingAnimation}
                  onTypingComplete={handleTypingComplete}
                />
              ))}
            </div>

            {/* Follow-up Suggestions */}
            {!isLoading && !error && suggestions.length > 0 && messages.length > 0 && (
              <FollowUpSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                disabled={isLoading || isRateLimited || !isOnline}
              />
            )}

            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}

            {/* Error Message with Retry */}
            {error && (
              <div
                className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 
                           rounded-lg text-sm"
                role="alert"
              >
                <p>{error}</p>
                {failedMessage && (
                  <RetryButton onRetry={handleRetry} disabled={isLoading || !isOnline} />
                )}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Offline Indicator */}
          {!isOnline && <OfflineIndicator isFullscreen={isFullscreen} />}

          {/* Rate Limit Indicator with countdown */}
          {isOnline && isRateLimited && rateLimitSecondsRemaining > 0 && (
            <RateLimitIndicator
              secondsRemaining={rateLimitSecondsRemaining}
              isFullscreen={isFullscreen}
            />
          )}

          {/* AI Disclaimer */}
          <AiDisclaimer />

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className={`p-3 border-t border-slate-700 flex-shrink-0 ${isFullscreen ? 'p-4' : ''}`}
          >
            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Type your message
              </label>
              <input
                ref={inputRef}
                id="chat-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isOnline
                    ? 'Offline...'
                    : isRateLimited
                      ? 'Please wait...'
                      : 'Type your message...'
                }
                maxLength={MAX_INPUT_LENGTH}
                disabled={isLoading || isRateLimited || !isOnline}
                className={`flex-1 bg-slate-800 text-slate-200 placeholder-slate-500 
                           px-4 rounded-full text-sm border border-slate-700
                           focus:outline-none focus:border-primary-500 focus:ring-1 
                           focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
                           ${isFullscreen ? 'py-3 text-base' : 'py-2'}`}
                aria-label="Type your message"
                aria-describedby="char-count"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRateLimited || !isOnline}
                className={`bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 
                           text-white rounded-full flex items-center justify-center 
                           transition-colors focus-ring disabled:cursor-not-allowed
                           ${isFullscreen ? 'w-12 h-12' : 'w-10 h-10'}`}
                aria-label="Send message"
              >
                <Send className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
              </button>
            </div>
            {/* Character count for accessibility */}
            <p id="char-count" className="sr-only">
              {input.length} of {MAX_INPUT_LENGTH} characters
            </p>
            {/* Visible character count when near limit */}
            {input.length > MAX_INPUT_LENGTH - 50 && (
              <p className="text-xs text-slate-500 mt-1 text-right">
                {input.length}/{MAX_INPUT_LENGTH}
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';

export default ChatWidget;
