/**
 * @fileoverview Hero section component - the landing/above-the-fold content.
 * @description Editorial-style introduction with headline, CTAs, and an "Ask my AI assistant" box.
 */

import React, { memo, useCallback, useState } from 'react';
import { ArrowRight, ArrowUp, Download, Sparkles } from 'lucide-react';
import { PERSONAL_INFO, SUGGESTED_QUESTIONS } from '../constants';
import { askChat } from '../utils/chatEvents';
import { trackEvent } from '../utils/analytics';

/** Maximum question length (aligned with chat backend) */
const MAX_QUESTION_LENGTH = 500;

/**
 * Hero section component for the portfolio landing area.
 * Features:
 * - Editorial light layout with serif headline and full-color portrait
 * - Primary CTAs: start a conversation, download résumé
 * - Inline question box that opens the AI chat widget
 *
 * @returns The hero section with intro content and visual elements
 */
const Hero: React.FC = memo(() => {
  const [question, setQuestion] = useState<string>('');

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuestion(e.target.value);
  }, []);

  const handleAskSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      const trimmed = question.trim();
      if (!trimmed) return;
      askChat(trimmed);
      trackEvent('hero_question_asked', { source: 'input' });
      setQuestion('');
    },
    [question]
  );

  const handleSuggestionClick = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    const suggested = e.currentTarget.dataset.question;
    if (!suggested) return;
    askChat(suggested);
    trackEvent('hero_question_asked', { source: 'suggestion' });
  }, []);

  const handleResumeClick = useCallback((): void => {
    trackEvent('resume_download', { location: 'hero' });
  }, []);

  return (
    <section id="hero" className="relative bg-paper text-ink pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="md:col-span-7 min-w-0 animate-fade-in-up motion-reduce:animate-none">
          {/* Mobile-only avatar keeps the headline above the fold */}
          <div className="flex items-center gap-4 mb-8 md:hidden">
            <img
              src="/michael-gavrilov-headshot.webp"
              alt=""
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <div className="font-semibold">{PERSONAL_INFO.name}</div>
              <div className="text-sm text-stone-600">{PERSONAL_INFO.title}</div>
            </div>
          </div>

          <h1 className="font-display text-[clamp(2.375rem,11.5vw,3rem)] sm:text-6xl md:text-7xl lg:text-8xl leading-[0.92] sm:leading-[0.95] tracking-tight text-balance">
            {/* Separate blocks so each line balances on its own (no lone "instinct.") */}
            <span className="block">{PERSONAL_INFO.tagline}</span>
            <span className="block text-primary-700">{PERSONAL_INFO.taglineHighlight}</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-stone-700 max-w-xl leading-relaxed">
            {PERSONAL_INFO.intro}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-ink text-paper hover:bg-stone-800 rounded-full font-semibold transition-colors focus-ring focus-visible:ring-offset-paper"
            >
              Start a conversation
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={PERSONAL_INFO.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleResumeClick}
              className="inline-flex items-center justify-center px-7 py-3.5 border border-stone-400 hover:border-ink text-ink rounded-full font-semibold transition-colors focus-ring focus-visible:ring-offset-paper"
            >
              <Download className="mr-2 w-4 h-4" aria-hidden="true" />
              Download résumé
            </a>
          </div>

          <div className="mt-12 max-w-xl">
            <form
              onSubmit={handleAskSubmit}
              aria-label="Ask my AI assistant"
              className="flex items-center gap-3 p-2 pl-5 bg-white border border-stone-300 focus-within:border-primary-700 rounded-full shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
              <label htmlFor="hero-question" className="sr-only">
                Ask my AI assistant a question
              </label>
              <input
                id="hero-question"
                type="text"
                value={question}
                onChange={handleQuestionChange}
                maxLength={MAX_QUESTION_LENGTH}
                placeholder="Ask my AI assistant about my work…"
                className="flex-1 min-w-0 py-2 bg-transparent text-ink placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!question.trim()}
                aria-label="Send question"
                className="w-10 h-10 shrink-0 rounded-full bg-primary-700 hover:bg-primary-800 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-ring focus-visible:ring-offset-white"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-stone-600 mr-1">
                Try asking
              </span>
              {SUGGESTED_QUESTIONS.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  data-question={suggested}
                  onClick={handleSuggestionClick}
                  className="px-3.5 py-1.5 text-left text-sm font-medium text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 hover:border-primary-400 rounded-full transition-colors focus-ring focus-visible:ring-offset-paper"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>
        </div>

        <figure className="hidden md:block md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden rounded-sm bg-stone-200">
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
          </div>
          <figcaption className="mt-4 pt-3 border-t border-stone-300 text-sm">
            <div className="font-semibold">{PERSONAL_INFO.name}</div>
            <div className="text-stone-600">
              {PERSONAL_INFO.title} · {PERSONAL_INFO.location}
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
