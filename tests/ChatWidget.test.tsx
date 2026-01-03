/**
 * @fileoverview Unit tests for ChatWidget component.
 * @author Michael Gavrilov
 * @version 1.1.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import ChatWidget from '../components/ChatWidget';

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

// localStorage key used by useChat hook
const STORAGE_KEY = 'aboutme-chat-history';

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
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
      expect(screen.getByText("What is Michael's experience?")).toBeInTheDocument();
      expect(screen.getByText('Key achievements?')).toBeInTheDocument();
      expect(screen.getByText('Current role?')).toBeInTheDocument();
    });

    it('sends message when quick question is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reply: 'Michael has 20+ years of experience.' }),
      });

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));
      fireEvent.click(screen.getByText("What is Michael's experience?"));

      await waitFor(() => {
        expect(screen.getByText("What is Michael's experience?")).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });
  });

  describe('Message Sending', () => {
    it('sends message when form is submitted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reply: 'Test response' }),
      });

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Test question')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });
    });

    it('clears input after sending message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reply: 'Response' }),
      });

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      expect(input.value).toBe('');
    });

    it('does not send empty messages', () => {
      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reply: 'Response' }),
      });

      render(<ChatWidget />);
      fireEvent.click(screen.getByLabelText('Open AI assistant'));

      const input = screen.getByLabelText('Type your message');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
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
