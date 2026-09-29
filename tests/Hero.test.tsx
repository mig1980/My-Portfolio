/**
 * @fileoverview Unit tests for Hero component.
 * @author Michael Gavrilov
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Hero from '../components/Hero';
import { CHAT_ASK_EVENT } from '../utils/chatEvents';
import { SUGGESTED_QUESTIONS, PERSONAL_INFO } from '../constants';
import type { ChatAskDetail } from '../types';

function listenForAsk(): { questions: string[]; stop: () => void } {
  const questions: string[] = [];
  const handler = (e: Event): void => {
    questions.push((e as CustomEvent<ChatAskDetail>).detail.question);
  };
  window.addEventListener(CHAT_ASK_EVENT, handler);
  return { questions, stop: () => window.removeEventListener(CHAT_ASK_EVENT, handler) };
}

function focusQuestionInput(): HTMLElement {
  const input = screen.getByRole('combobox', { name: /ask my ai assistant a question/i });
  act(() => input.focus());
  return input;
}

describe('Hero', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PERSONAL_INFO.tagline);
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

  it('shows suggested questions when the empty input is focused, and hides them while typing', () => {
    render(<Hero />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    const input = focusQuestionInput();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(SUGGESTED_QUESTIONS.length);

    fireEvent.change(input, { target: { value: 'H' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('listbox', { name: 'Try asking' })).toBeInTheDocument();
  });

  it('sends a clicked suggestion to the chat and closes the list', () => {
    const { questions, stop } = listenForAsk();
    const [firstQuestion = ''] = SUGGESTED_QUESTIONS;
    render(<Hero />);

    focusQuestionInput();
    fireEvent.click(screen.getByRole('option', { name: firstQuestion }));

    expect(questions).toEqual([firstQuestion]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    stop();
  });

  it('picks a suggestion with the arrow keys and Enter', () => {
    const { questions, stop } = listenForAsk();
    render(<Hero />);
    const input = focusQuestionInput();

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const lastIndex = SUGGESTED_QUESTIONS.length - 1;
    expect(input).toHaveAttribute('aria-activedescendant', `hero-suggestions-${lastIndex}`);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: SUGGESTED_QUESTIONS[0] })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(questions).toEqual([SUGGESTED_QUESTIONS[0]]);
    stop();
  });

  it('closes the suggestions with Escape', () => {
    render(<Hero />);
    const input = focusQuestionInput();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the fit check dialog and closes it again', async () => {
    render(<Hero />);
    const button = screen.getByRole('button', { name: /let my ai match your role/i });

    fireEvent.click(button);
    expect(await screen.findByRole('dialog', { name: /check michael's fit/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(button).toHaveFocus();
  });
});
