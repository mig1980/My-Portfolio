/**
 * @fileoverview Hero section component - the landing/above-the-fold content.
 * @description Editorial-style introduction with headline, fit check link, and an "Ask my AI assistant" box.
 */

import React, { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, Sparkles } from 'lucide-react';
import { PERSONAL_INFO, SUGGESTED_QUESTIONS } from '../constants';
import { askChat } from '../utils/chatEvents';
import { trackEvent } from '../utils/analytics';
import { MAX_CHAT_MESSAGE_LENGTH } from '../utils/chatLimits';

const FitCheckDialog = lazy(() => import('./FitCheckDialog'));

const SUGGESTIONS_ID = 'hero-suggestions';
const SUGGESTIONS_LABEL_ID = 'hero-suggestions-label';

const SHORTEST_PLACEHOLDER = 'Ask my AI assistant…';

/** Input hints, longest first; the longest one that fits the input is shown. */
const PLACEHOLDERS = [
  'Ask my AI assistant how I approach complex problems…',
  'Ask how I approach complex problems…',
  SHORTEST_PLACEHOLDER,
] as const;

/**
 * Hero section component for the portfolio landing area.
 * Features:
 * - Editorial light layout with serif headline and framed portrait
 * - "Check my fit" link for recruiters
 * - Question box that opens the AI chat widget, with suggested questions in a drop-down
 *
 * @returns The hero section with intro content and visual elements
 */
const Hero: React.FC = memo(() => {
  const [question, setQuestion] = useState<string>('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [placeholder, setPlaceholder] = useState<string>(PLACEHOLDERS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Swap to a shorter hint where the long one would be cut off
  useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof ResizeObserver === 'undefined') return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;

    let isActive = true;
    const fitPlaceholder = (): void => {
      if (!isActive) return;
      context.font = getComputedStyle(input).font;
      const available = input.clientWidth;
      setPlaceholder(
        PLACEHOLDERS.find((hint) => context.measureText(hint).width <= available) ??
          SHORTEST_PLACEHOLDER
      );
    };

    const observer = new ResizeObserver(fitPlaceholder);
    observer.observe(input);
    // Measurements change once the web font replaces the fallback
    void document.fonts?.ready.then(fitPlaceholder);
    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, []);

  const closeSuggestions = useCallback((): void => {
    setIsSuggestionsOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleInputActivate = useCallback((): void => {
    if (!question) setIsSuggestionsOpen(true);
  }, [question]);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    setQuestion(value);
    setActiveIndex(-1);
    setIsSuggestionsOpen(value === '');
  }, []);

  const handleAskSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      const trimmed = question.trim();
      if (!trimmed) return;
      askChat(trimmed);
      trackEvent('hero_question_asked', { source: 'input' });
      setQuestion('');
      closeSuggestions();
    },
    [question, closeSuggestions]
  );

  const askSuggestion = useCallback(
    (index: number): void => {
      const suggested = SUGGESTED_QUESTIONS[index];
      if (!suggested) return;
      askChat(suggested);
      trackEvent('hero_question_asked', { source: 'suggestion' });
      closeSuggestions();
    },
    [closeSuggestions]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Escape') {
        closeSuggestions();
        return;
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !question) {
        e.preventDefault();
        const count = SUGGESTED_QUESTIONS.length;
        const isDown = e.key === 'ArrowDown';
        setIsSuggestionsOpen(true);
        setActiveIndex((current) => {
          if (current < 0) return isDown ? 0 : count - 1;
          return (current + (isDown ? 1 : -1) + count) % count;
        });
        return;
      }
      if (e.key === 'Enter' && isSuggestionsOpen && activeIndex >= 0) {
        e.preventDefault();
        askSuggestion(activeIndex);
      }
    },
    [question, isSuggestionsOpen, activeIndex, askSuggestion, closeSuggestions]
  );

  // Keeps focus in the input, so its blur doesn't close the list before the click lands
  const handleSuggestionMouseDown = useCallback((e: React.MouseEvent<HTMLLIElement>): void => {
    e.preventDefault();
  }, []);

  const handleSuggestionClick = useCallback(
    (e: React.MouseEvent<HTMLLIElement>): void => {
      askSuggestion(Number(e.currentTarget.dataset.index));
    },
    [askSuggestion]
  );

  const [isFitCheckOpen, setIsFitCheckOpen] = useState<boolean>(false);
  const fitCheckButtonRef = useRef<HTMLButtonElement>(null);

  const handleFitCheckOpen = useCallback((): void => {
    setIsFitCheckOpen(true);
  }, []);

  const handleFitCheckClose = useCallback((): void => {
    setIsFitCheckOpen(false);
    fitCheckButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section id="hero" className="relative bg-paper text-ink pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-7xl mx-auto px-6 lg:grid lg:grid-cols-12 lg:gap-16 lg:items-start">
        <div className="lg:col-span-7 min-w-0 max-w-2xl lg:max-w-none flex flex-col animate-fade-in-up motion-reduce:animate-none">
          {/* Shown while the portrait column is hidden, so the page still says who this is */}
          <div className="flex items-center gap-4 mb-8 lg:hidden">
            <img
              src="/michael-gavrilov-headshot.webp"
              alt=""
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover object-top"
            />
            <div className="text-[0.9375rem] leading-snug">
              <div className="font-semibold">{PERSONAL_INFO.name}</div>
              <div className="text-stone-600">
                {PERSONAL_INFO.title} · {PERSONAL_INFO.location}
              </div>
            </div>
          </div>

          <h1 className="font-display text-[clamp(2.375rem,11.5vw,3rem)] sm:text-6xl md:text-7xl xl:text-8xl leading-[0.92] sm:leading-[0.95] tracking-tight text-balance">
            {/* Separate blocks so each line balances on its own */}
            <span className="block">{PERSONAL_INFO.tagline}</span>{' '}
            <span className="block text-primary-700">{PERSONAL_INFO.taglineHighlight}</span>
          </h1>

          <p className="mt-10 text-lg md:text-xl text-stone-700 max-w-xl leading-relaxed">
            {PERSONAL_INFO.intro}
          </p>

          <button
            ref={fitCheckButtonRef}
            type="button"
            onClick={handleFitCheckOpen}
            aria-haspopup="dialog"
            className="group mt-4 self-start text-left text-[0.9375rem] leading-[1.6] text-stone-600 rounded-sm focus-ring focus-visible:ring-offset-paper"
          >
            Hiring?{' '}
            <Sparkles
              className="inline-block w-3.5 h-3.5 mx-0.5 align-[-2px] text-primary-700"
              aria-hidden="true"
            />{' '}
            <span className="font-semibold text-ink underline decoration-stone-400 group-hover:decoration-ink underline-offset-4 transition-colors">
              Let my AI match your role to my résumé
            </span>
            <ArrowRight className="inline-block ml-1.5 w-4 h-4 align-[-3px]" aria-hidden="true" />
          </button>
          <Suspense fallback={null}>
            {isFitCheckOpen && <FitCheckDialog onClose={handleFitCheckClose} />}
          </Suspense>

          <div className="relative mt-[3.125rem] max-w-xl">
            <form
              onSubmit={handleAskSubmit}
              aria-label="Ask my AI assistant"
              className="flex items-center gap-3 py-2.5 pr-2.5 pl-[1.375rem] bg-white border border-stone-400 hover:border-stone-600 focus-within:border-primary-700 hover:focus-within:border-primary-700 rounded-full shadow-[0_1px_2px_rgba(28,25,23,0.06),0_8px_24px_rgba(28,25,23,0.06)] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
              <label htmlFor="hero-question" className="sr-only">
                Ask my AI assistant a question
              </label>
              <input
                ref={inputRef}
                id="hero-question"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isSuggestionsOpen}
                aria-controls={SUGGESTIONS_ID}
                aria-activedescendant={
                  isSuggestionsOpen && activeIndex >= 0
                    ? `${SUGGESTIONS_ID}-${activeIndex}`
                    : undefined
                }
                autoComplete="off"
                value={question}
                onChange={handleQuestionChange}
                onFocus={handleInputActivate}
                onClick={handleInputActivate}
                onBlur={closeSuggestions}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_CHAT_MESSAGE_LENGTH}
                placeholder={placeholder}
                className="flex-1 min-w-0 py-2 bg-transparent text-[1.0625rem] text-ink placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!question.trim()}
                aria-label="Send question"
                className="w-11 h-11 shrink-0 rounded-full bg-ink hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors focus-ring focus-visible:ring-offset-white"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div
              hidden={!isSuggestionsOpen}
              className="absolute left-0 right-0 top-full z-20 mt-2 p-2 bg-white border border-stone-300 rounded-2xl shadow-[0_12px_32px_rgba(28,25,23,0.12)]"
            >
              <p
                id={SUGGESTIONS_LABEL_ID}
                className="px-3 pt-1.5 pb-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-stone-500"
              >
                Try asking
              </p>
              <ul id={SUGGESTIONS_ID} role="listbox" aria-labelledby={SUGGESTIONS_LABEL_ID}>
                {SUGGESTED_QUESTIONS.map((suggested, index) => (
                  // Keyboard selection happens on the combobox input (aria-activedescendant); options never take focus
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                  <li
                    key={suggested}
                    id={`${SUGGESTIONS_ID}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-index={index}
                    onMouseDown={handleSuggestionMouseDown}
                    onClick={handleSuggestionClick}
                    className={`group/option flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[0.9375rem] text-stone-800 cursor-pointer hover:bg-stone-100 ${
                      index === activeIndex ? 'bg-stone-100' : ''
                    }`}
                  >
                    {suggested}
                    <ArrowUp
                      className={`w-4 h-4 shrink-0 text-stone-400 group-hover/option:opacity-100 ${
                        index === activeIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Width capped so the photo ends level with the ask box */}
        <figure className="hidden lg:block lg:col-span-5 w-full lg:max-w-[353px] xl:max-w-[408px] justify-self-end">
          <div className="p-2.5 bg-[#fdfcf9] border border-stone-200 rounded-[3px] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-stone-200">
              <picture>
                <source srcSet="/michael-gavrilov-headshot.webp" type="image/webp" />
                <img
                  src="/michael-gavrilov-headshot.jpg"
                  alt="Michael Gavrilov - Strategic Account Director at Microsoft specializing in Enterprise AI"
                  width={640}
                  height={800}
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-cover object-top"
                />
              </picture>
              {/* Faint cream multiply warms the cool studio backdrop to match the paper tone */}
              <div
                className="pointer-events-none absolute inset-0 bg-[#f3e4cf] mix-blend-multiply opacity-35"
                aria-hidden="true"
              />
            </div>
          </div>
          {/* Inset by the frame's padding + border so the text lines up with the photo */}
          <figcaption className="mx-[11px] mt-4 pt-3 border-t border-stone-300 text-base leading-normal">
            <div className="text-lg font-semibold">{PERSONAL_INFO.name}</div>
            <div className="text-stone-600">{PERSONAL_INFO.title}</div>
            <div className="text-stone-600">{PERSONAL_INFO.location}</div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
