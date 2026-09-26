/**
 * @fileoverview Floating AI chat widget component.
 * @description Provides an interactive chat interface for portfolio visitors.
 * Features: typing animation, timestamps, AI disclaimer, localStorage persistence.
 * @author Michael Gavrilov
 * @version 1.2.0
 */

import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight,
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
import { useScrollPosition } from '../hooks/useScrollPosition';
import { CHAT_ASK_EVENT } from '../utils/chatEvents';
import { CHAT_WELCOME_QUESTIONS } from '../constants';
import type { ChatAskDetail, ChatMessage } from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum input length (aligned with backend) */
const MAX_INPUT_LENGTH = 500;

/** Typing animation speed (ms per character) - respects prefers-reduced-motion */
const TYPING_SPEED_MS = 12;

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
  /** Scroll depth (px) before the greeting may appear; the hero has its own ask box */
  SCROLL_THRESHOLD_PX: 600,
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
                ? 'bg-primary-700 text-white rounded-br-md'
                : 'bg-stone-100 text-ink rounded-bl-md'
            }`}
          >
            {isUser ? message.content : displayedText}
            {/* Typing cursor for animation effect */}
            {isTyping && (
              <span
                className="inline-block w-0.5 h-4 bg-primary-700 ml-0.5 animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Timestamp */}
          <span
            className={`text-xs text-stone-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}
            aria-label={`Sent ${formattedTime}`}
          >
            {formattedTime}
          </span>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div
            className="w-7 h-7 rounded-full bg-stone-200 flex items-center 
                     justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <User className="w-4 h-4 text-stone-700" />
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
    <div className="bg-stone-100 px-4 py-3 rounded-2xl rounded-bl-md">
      <div
        className="flex gap-1.5 motion-reduce:hidden"
        role="status"
        aria-label="Loading response"
      >
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce animation-delay-150" />
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce animation-delay-300" />
      </div>
      {/* Fallback for reduced motion */}
      <span className="hidden motion-reduce:block text-stone-600 text-sm">Thinking...</span>
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
    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-50 
               border-t border-stone-200 text-xs text-stone-600"
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
    className={`flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 
               border-t border-amber-200 text-xs text-amber-800
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
        className={`px-3 py-2 bg-amber-50 border-t border-amber-200 
                   ${isFullscreen ? 'py-3' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5">
          <span>Rate limit - please wait</span>
          <span className="font-mono">{secondsRemaining}s</span>
        </div>
        <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
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
            className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 
                     text-primary-800 text-xs rounded-full transition-colors 
                     focus-ring border border-primary-200
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
               bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 
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
    className="fixed bottom-24 right-6 z-40 max-w-[280px]
               motion-safe:animate-[fadeSlideIn_0.3s_ease-out]"
    role="status"
    aria-live="polite"
  >
    {/* Speech bubble with tail */}
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white text-ink border border-stone-200 px-4 py-3 rounded-2xl 
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
        className="absolute -top-2 -right-2 w-6 h-6 bg-ink hover:bg-stone-700
                   text-white rounded-full flex items-center justify-center
                   shadow-md transition-colors focus-ring"
        aria-label="Dismiss greeting"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {/* Bubble tail pointing to chat button */}
      <div
        className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-stone-200 transform rotate-45"
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
 * - Positioned bottom-right; BackToTop sits to its left
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

  // Mobile responsiveness
  const isMobile = useIsMobile();
  const isFullscreen = isMobile && isOpen;

  // Online status
  const isOnline = useOnlineStatus();

  const hasScrolledPastHero = useScrollPosition({
    threshold: GREETING_BUBBLE.SCROLL_THRESHOLD_PX,
  });

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
    // Don't show if: already dismissed, chat is open, or visitor is still on the hero
    if (wasGreetingDismissed() || isOpen || !hasScrolledPastHero) {
      return;
    }

    // Use local variables for cleanup (avoid stale ref issues)
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    // Show after delay
    showTimer = setTimeout(() => {
      // Check if effect was cleaned up during the delay
      if (isCancelled) return;

      setShowGreetingBubble(true);

      // Auto-hide after duration (if configured)
      if (GREETING_BUBBLE.AUTO_HIDE_MS > 0) {
        hideTimer = setTimeout(() => {
          if (isCancelled) return;
          setShowGreetingBubble(false);
          // Don't mark as dismissed on auto-hide - show again on next visit
        }, GREETING_BUBBLE.AUTO_HIDE_MS);
      }
    }, GREETING_BUBBLE.SHOW_DELAY_MS);

    // Cleanup timers on unmount or when dependencies change
    return () => {
      isCancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isOpen, hasScrolledPastHero, wasGreetingDismissed]);

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

    // Use requestAnimationFrame for smoother focus after paint
    // This avoids blocking the animation and reduces jank
    let timeoutId: ReturnType<typeof setTimeout>;

    const rafId = requestAnimationFrame(() => {
      // Small additional delay to ensure animation completes
      timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
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

  // Questions asked from elsewhere on the page (e.g. the hero ask box)
  useEffect(() => {
    const handleAsk = (e: Event): void => {
      const question = (e as CustomEvent<ChatAskDetail>).detail?.question?.trim();
      if (!question) return;
      setIsOpen(true);
      if (isOnline) void sendMessage(question);
    };

    window.addEventListener(CHAT_ASK_EVENT, handleAsk);
    return () => window.removeEventListener(CHAT_ASK_EVENT, handleAsk);
  }, [sendMessage, isOnline]);

  const toggleChat = useCallback((): void => {
    // Check current state BEFORE updating
    // This avoids doing work inside setState callback which can cause jank
    if (isOpen) {
      // Closing - blur elements in next frame to avoid blocking
      requestAnimationFrame(() => {
        inputRef.current?.blur();
        if (typeof document !== 'undefined') {
          const active = document.activeElement;
          if (active instanceof HTMLElement) {
            active.blur();
          }
        }
      });
    }
    setIsOpen((prev) => !prev);
  }, [isOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  }, []);

  const handleClearHistory = useCallback((): void => {
    clearHistory();
  }, [clearHistory]);

  return (
    <>
      {/* Greeting Bubble - shows after delay for first-time visitors */}
      {showGreetingBubble && hasScrolledPastHero && !isOpen && !isFullscreen && (
        <GreetingBubble onDismiss={dismissGreeting} onClick={handleGreetingClick} />
      )}

      {/* Floating Toggle Button - hidden on the hero (it has its own ask box) unless chat is open, and when fullscreen */}
      {!isFullscreen && (hasScrolledPastHero || isOpen) && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-700 hover:bg-primary-800 
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
          className={`fixed z-50 bg-white flex flex-col overflow-hidden
                      motion-safe:animate-[slideUp_0.2s_ease-out]
                      ${
                        isFullscreen
                          ? 'inset-0 rounded-none border-0'
                          : 'bottom-24 right-6 w-[380px] max-w-[calc(100vw-48px)] border border-stone-200 rounded-2xl shadow-2xl'
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
            className={`bg-ink px-4 py-3 
                       flex items-center justify-between flex-shrink-0
                       ${isFullscreen ? 'py-4' : ''}`}
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
                <p className="text-stone-300 text-xs">Ask about Michael</p>
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              className="p-2 text-stone-300 hover:text-white hover:bg-white/10 
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
              <div>
                <div className="text-center">
                  <h3 className="text-ink font-semibold mb-1">
                    Hi! I&apos;m Michael&apos;s AI assistant
                  </h3>
                  <p className="text-stone-600 text-sm mb-5">
                    Ask me anything about Michael&apos;s professional background, experience, or
                    skills.
                  </p>
                </div>

                {/* Quick Questions */}
                <p className="text-stone-600 text-xs uppercase tracking-wide mb-2">Try asking</p>
                <div className="flex flex-col gap-2">
                  {CHAT_WELCOME_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => handleQuickQuestion(question)}
                      className="group flex items-center justify-between gap-3 w-full px-4 py-3 text-left
                                 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200
                                 hover:border-primary-400 text-sm font-medium rounded-xl transition-colors focus-ring
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || isRateLimited || !isOnline}
                    >
                      <span>{question}</span>
                      <ArrowRight
                        className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
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
                className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 
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
            className={`p-3 border-t border-stone-200 flex-shrink-0 ${isFullscreen ? 'p-4' : ''}`}
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
                className={`flex-1 bg-stone-50 text-ink placeholder-stone-500 
                           px-4 rounded-full text-base border border-stone-300
                           focus:outline-none focus:border-primary-700 focus:ring-1 
                           focus:ring-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                           py-2 ${isFullscreen ? 'py-3' : ''}`}
                aria-label="Type your message"
                aria-describedby="char-count"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRateLimited || !isOnline}
                className={`bg-primary-700 hover:bg-primary-800 disabled:bg-stone-300 
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
              <p className="text-xs text-stone-600 mt-1 text-right">
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
