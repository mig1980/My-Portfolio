/**
 * @fileoverview Unit tests for Hero component.
 * @author Michael Gavrilov
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Hero from '../components/Hero';
import { CHAT_ASK_EVENT } from '../utils/chatEvents';
import { HERO_QUESTIONS, PERSONAL_INFO } from '../constants';
import type { ChatAskDetail } from '../types';

function listenForAsk(): { questions: string[]; stop: () => void } {
  const questions: string[] = [];
  const handler = (e: Event): void => {
    questions.push((e as CustomEvent<ChatAskDetail>).detail.question);
  };
  window.addEventListener(CHAT_ASK_EVENT, handler);
  return { questions, stop: () => window.removeEventListener(CHAT_ASK_EVENT, handler) };
}

describe('Hero', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PERSONAL_INFO.tagline);
  });

  it('links to the résumé in a new tab safely', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /download résumé/i });
    expect(link).toHaveAttribute('href', PERSONAL_INFO.resumeUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('disables the send button until a question is typed', () => {
    render(<Hero />);
    const send = screen.getByRole('button', { name: 'Send question' });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/ask my ai assistant a question/i), {
      target: { value: 'Hello' },
    });
    expect(send).toBeEnabled();
  });

  it('sends a typed question to the chat and clears the input', () => {
    const { questions, stop } = listenForAsk();
    render(<Hero />);
    const input = screen.getByLabelText(/ask my ai assistant a question/i);

    fireEvent.change(input, { target: { value: '  What is his AI focus?  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(questions).toEqual(['What is his AI focus?']);
    expect(input).toHaveValue('');
    stop();
  });

  it('sends a suggested question to the chat', () => {
    const { questions, stop } = listenForAsk();
    const [firstQuestion = ''] = HERO_QUESTIONS;
    render(<Hero />);

    fireEvent.click(screen.getByRole('button', { name: firstQuestion }));

    expect(questions).toEqual([firstQuestion]);
    stop();
  });
});
