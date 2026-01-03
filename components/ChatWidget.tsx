/**
 * @fileoverview Floating AI chat widget component.
 * @description Provides an interactive chat interface for portfolio visitors.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, User } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum input length (aligned with backend) */
const MAX_INPUT_LENGTH = 500;

/** Suggested questions for new users */
const QUICK_QUESTIONS: readonly string[] = [
  "What is Michael's experience?",
  'Key achievements?',
  'Current role?',
] as const;

// ============================================================================
// Sub-Components
// ============================================================================

/** Props for MessageBubble component */
interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Individual message bubble component.
 * Memoized to prevent unnecessary re-renders.
 */
const MessageBubble = memo<MessageBubbleProps>(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`} role="listitem">
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

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-slate-800 text-slate-200 rounded-bl-md'
        }`}
      >
        {message.content}
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
});

MessageBubble.displayName = 'MessageBubble';

/**
 * Loading indicator with animated dots.
 * Respects prefers-reduced-motion.
 */
const LoadingIndicator = memo(() => (
  <div className="flex gap-2 justify-start" role="listitem">
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
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {/* Fallback for reduced motion */}
      <span className="hidden motion-reduce:block text-slate-400 text-sm">Thinking...</span>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

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
  const { messages, isLoading, error, isRateLimited, sendMessage, clearHistory } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure animation completes
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
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
      if (!input.trim() || isLoading || isRateLimited) return;

      const message = input;
      setInput('');
      await sendMessage(message);
    },
    [input, isLoading, isRateLimited, sendMessage]
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
      void sendMessage(question);
    },
    [sendMessage]
  );

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
      {/* Floating Toggle Button - positioned bottom-left to avoid BackToTop conflict */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 
                   text-white rounded-full shadow-lg flex items-center justify-center 
                   transition-all duration-300 hover:scale-110 focus-ring
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

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-dialog"
          className="fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-48px)] 
                     bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl 
                     flex flex-col overflow-hidden
                     motion-safe:animate-[slideUp_0.2s_ease-out]"
          style={{ height: 'min(520px, calc(100vh - 150px))' }}
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
            className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 
                       flex items-center justify-between flex-shrink-0"
          >
            <div className="flex items-center gap-2">
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
                         rounded-lg transition-colors focus-ring"
              aria-label="Clear chat history"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            role="list"
            aria-label="Chat messages"
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
                        disabled={isLoading || isRateLimited}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}

            {/* Error Message */}
            {error && (
              <div
                className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 
                           rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex-shrink-0">
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
                placeholder={isRateLimited ? 'Please wait...' : 'Type your message...'}
                maxLength={MAX_INPUT_LENGTH}
                disabled={isLoading || isRateLimited}
                className="flex-1 bg-slate-800 text-slate-200 placeholder-slate-500 
                           px-4 py-2 rounded-full text-sm border border-slate-700
                           focus:outline-none focus:border-primary-500 focus:ring-1 
                           focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Type your message"
                aria-describedby="char-count"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRateLimited}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 
                           text-white rounded-full flex items-center justify-center 
                           transition-colors focus-ring disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
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
