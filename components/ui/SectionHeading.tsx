/**
 * @fileoverview Shared editorial section heading.
 * @description Numbered eyebrow label, serif title, and optional intro used by every section.
 */

import React, { memo, type ReactNode } from 'react';

/**
 * Props for the SectionHeading component.
 */
interface SectionHeadingProps {
  /** Chapter number shown in the eyebrow, e.g. "01" */
  number: string;
  /** Short eyebrow label, e.g. "About" */
  label: string;
  /** Main heading text */
  title: ReactNode;
  /** Optional supporting paragraph */
  intro?: ReactNode;
  /** Use light text for dark (ink) backgrounds */
  onDark?: boolean;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Editorial section heading: "01 — About" eyebrow, serif h2, optional intro.
 *
 * @param props - Component props
 * @returns The section heading block
 */
const SectionHeading: React.FC<SectionHeadingProps> = memo(
  ({ number, label, title, intro, onDark = false, className = '' }) => (
    <div className={`max-w-3xl ${className}`}>
      <p
        className={`font-mono text-xs uppercase tracking-[0.2em] mb-4 ${
          onDark ? 'text-stone-400' : 'text-stone-600'
        }`}
      >
        <span className={onDark ? 'text-primary-300' : 'text-primary-700'}>{number}</span>
        <span aria-hidden="true"> — </span>
        {label}
      </p>
      <h2
        className={`font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight ${
          onDark ? 'text-paper' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-5 text-lg leading-relaxed ${onDark ? 'text-stone-300' : 'text-stone-700'}`}
        >
          {intro}
        </p>
      )}
    </div>
  )
);

SectionHeading.displayName = 'SectionHeading';

export default SectionHeading;
