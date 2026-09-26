/**
 * @fileoverview Unit tests for ChatWidget component.
 * @author Michael Gavrilov
 * @version 1.1.0
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import ChatWidget from '../components/ChatWidget';
import { askChat } from '../utils/chatEvents';
import { CHAT_WELCOME_QUESTIONS } from '../constants';

const scrollState = vi.hoisted(() => ({ pastHero: true }));
vi.mock('../hooks/useScrollPosition', () => ({
  useScrollPosition: (): boolean => scrollState.pastHero,
}));

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

// localStorage key used by useChat hook
const STORAGE_KEY = 'aboutme-chat-history';

/**
 * Helper to create a mock fetch response with both json() and text() methods
 */
function createMockResponse(
  data: object,
  options: { ok?: boolean; status?: number } = {}
): { ok: boolean; status: number; json: () => Promise<object>; text: () => Promise<string> } {
  const { ok = true, status = 200 } = options;
  const jsonString = JSON.stringify(data);
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(jsonString),
  };
}

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    scrollState.pastHero = true;
    // Clear localStorage before each test to ensure clean state
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up localStorage after tests
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('Initial State', () => {
    it('renders the chat toggle button', () => {
      render(<ChatWidget />);
      expect(screen.getByLabelText('Open AI assistant')).toBeInTheDocument();
    });

    it('does not show chat window initially', () => {
      render(<ChatWidget />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('hides the toggle button while the visitor is on the hero', () => {
      scrollState.pastHero = false;
      render(<ChatWidget />);
      expect(screen.queryByLabelText('Open AI assistant')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('opens chat window when toggle is clicked', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows welcome message when chat is opened', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      expect(screen.getByText(/I'm Michael's AI assistant/i)).toBeInTheDocument();
    });

    it('closes chat when close button is clicked', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close chat'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes chat on Escape key press', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Quick Questions', () => {
    it('displays quick question buttons', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      for (const question of CHAT_WELCOME_QUESTIONS) {
        expect(screen.getByText(question)).toBeInTheDocument();
      }
    });

    it('sends message when quick question is clicked', async () => {
      const [firstQuestion = ''] = CHAT_WELCOME_QUESTIONS;
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ reply: 'Michael has 20+ years of experience.' })
      );

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      fireEvent.click(screen.getByText(firstQuestion));

      await waitFor(() => {
        expect(screen.getByText(firstQuestion)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });
  });

  describe('Message Sending', () => {
    it('sends message when form is submitted', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Test response' }));

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Test question')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Test response').length).toBeGreaterThan(0);
      });
    });

    it('clears input after sending message', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Response' }));

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      expect(input.value).toBe('');

      // Wait for the async fetch to resolve to avoid act() warnings
      await waitFor(() => {
        expect(screen.getAllByText('Response').length).toBeGreaterThan(0);
      });
    });

    it('does not send empty messages', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('opens and sends a question asked from elsewhere on the page', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Hero answer' }));

      render(<ChatWidget />);
      act(() => {
        askChat('Question from hero');
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getAllByText('Hero answer').length).toBeGreaterThan(0);
      });
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(String(init.body))).toMatchObject({ message: 'Question from hero' });
    });

    it('keeps a question asked from elsewhere in the input while a reply is loading', async () => {
      let resolveFetch: (value: unknown) => void = () => {};
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => (resolveFetch = resolve)));

      render(<ChatWidget />);
      act(() => {
        askChat('First question');
      });
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      act(() => {
        askChat('Second question');
      });

      expect(screen.getByLabelText('Type your message')).toHaveValue('Second question');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFetch(createMockResponse({ reply: 'Done' }));
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Server error' }, { ok: false, status: 500 })
      );

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Clear History', () => {
    it('clears messages when clear button is clicked', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reply: 'Response' }));

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getAllByText('Response').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getByLabelText('Clear chat history'));

      // Welcome message should be back
      expect(screen.getByText(/I'm Michael's AI assistant/i)).toBeInTheDocument();
    });

    it('disables clear button when no messages', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const clearButton = screen.getByLabelText('Clear chat history');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on dialog', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'AI Assistant Chat');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-describedby', 'chat-description');
    });

    it('has screen reader description', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      expect(screen.getByText(/Chat with an AI assistant/i)).toBeInTheDocument();
    });

    it('toggle button has aria-expanded state', () => {
      render(<ChatWidget />);
      const button = screen.getByLabelText('Open AI assistant');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(screen.getByLabelText('Close chat')).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
