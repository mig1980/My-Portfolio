/**
 * @fileoverview About section component with personal summary and awards.
 * @description Displays biographical information, awards, and personal interests.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { PERSONAL_INFO, AWARDS, INTERESTS } from '../constants';
import { ArrowUpRight } from 'lucide-react';
import type { AwardItem } from '../types';

/**
 * Pre-computed style configurations for award card color variants.
 * Defined outside component to avoid recreation on each render.
 */
interface AwardStyleConfig {
  /** Text color for the award level */
  accentText: string;
  /** Top border color for the card */
  accentBar: string;
}

const AWARD_STYLES: Record<NonNullable<AwardItem['color']>, AwardStyleConfig> = {
  platinum: { accentText: 'text-stone-700', accentBar: 'border-t-stone-400' },
  gold: { accentText: 'text-amber-800', accentBar: 'border-t-amber-500' },
  purple: { accentText: 'text-purple-800', accentBar: 'border-t-purple-500' },
  green: { accentText: 'text-emerald-800', accentBar: 'border-t-emerald-500' },
  blue: { accentText: 'text-primary-700', accentBar: 'border-t-primary-600' },
};

/** Default style for awards without a specified color */
const DEFAULT_AWARD_STYLE: AwardStyleConfig = AWARD_STYLES.blue;

/** Shared eyebrow style for About subsections */
const SUBHEADING_CLASS = 'font-mono text-xs uppercase tracking-[0.2em] text-stone-600 mb-6';

/**
 * About section component displaying personal information.
 * Features:
 * - Personal summary with pull quote
 * - Awards and recognition grid with color-coded tiers
 * - Personal interests showcase
 *
 * @returns The about section with bio, awards, and interests
 */
const About: React.FC = memo(() => {
  return (
    <Section id="about" className="pt-14 md:pt-20">
      <div className="grid md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-4">
          <SectionHeading number="01" label="About" title="About me" />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-stone-600">
            Based in {PERSONAL_INFO.location}
          </p>
          <blockquote className="mt-8 border-l-2 border-primary-700 pl-5 font-display text-2xl italic leading-snug text-ink">
            Colleagues know me as someone who listens first, gives honest advice, and turns complex
            challenges into actionable plans.
          </blockquote>
        </div>

        <div className="md:col-span-8">
          <div className="space-y-6 text-lg text-stone-700 leading-relaxed [&>p:first-child]:text-xl [&>p:first-child]:text-ink">
            {PERSONAL_INFO.summary.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Awards & Recognition Subsection */}
          <div className="mt-16">
            <h3 className={SUBHEADING_CLASS}>Honors &amp; achievements</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {AWARDS.map((award) => {
                const { accentText, accentBar } = award.color
                  ? AWARD_STYLES[award.color]
                  : DEFAULT_AWARD_STYLE;

                const CardWrapper = award.link ? 'a' : 'div';
                const cardProps = award.link
                  ? {
                      href: award.link,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      'aria-label': `View ${award.title} certificate`,
                    }
                  : {};

                return (
                  <CardWrapper
                    key={award.id}
                    {...cardProps}
                    className={`group relative p-5 rounded-lg border border-stone-200 border-t-2 ${accentBar} bg-white transition-[border-color,box-shadow,transform] duration-300 hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
                      award.link ? 'cursor-pointer focus-ring-inset' : ''
                    }`}
                  >
                    {award.link && (
                      <ArrowUpRight
                        className="absolute top-4 right-4 w-4 h-4 text-stone-500 group-hover:text-ink transition-colors"
                        aria-hidden="true"
                      />
                    )}

                    {award.badgeUrl && (
                      <div className="mb-3 p-1.5 bg-white rounded-md inline-block overflow-hidden border border-stone-200">
                        <img
                          src={award.badgeUrl}
                          alt={`${award.title} badge`}
                          width={48}
                          height={48}
                          loading="lazy"
                          className={`w-12 h-12 object-contain ${award.title !== 'Champion Award' ? 'scale-150' : ''}`}
                        />
                      </div>
                    )}

                    <h4 className="text-ink font-semibold text-lg mb-1">{award.title}</h4>

                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-3">
                      {award.issuer && `${award.issuer} • `}
                      <span className={accentText}>{award.awardLevel}</span>
                    </div>

                    <p className="text-sm text-stone-700 leading-snug">{award.description}</p>
                  </CardWrapper>
                );
              })}
            </div>
          </div>

          {/* Life Pillars Subsection */}
          <div className="mt-16">
            <h3 className={SUBHEADING_CLASS}>Life pillars</h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
              {INTERESTS.map((interest) => (
                <div key={interest.id} className="border-t border-stone-300 pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-primary-700">{interest.icon}</span>
                    <h4 className="text-ink font-semibold">{interest.label}</h4>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">{interest.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
});

About.displayName = 'About';

export default About;
