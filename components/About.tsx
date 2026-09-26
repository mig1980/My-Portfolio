/**
 * @fileoverview About section component with personal summary and awards.
 * @description Displays biographical information, awards, and personal interests.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { PERSONAL_INFO, AWARDS, OUTSIDE_WORK, OUTSIDE_WORK_MOTTO } from '../constants';
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
 * - Personal summary with emphasized closing line
 * - Awards and recognition grid with color-coded tiers
 * - Outside work
 *
 * @returns The about section with bio, awards, and life outside work
 */
const About: React.FC = memo(() => {
  return (
    <Section id="about" className="pt-14 md:pt-20">
      <div className="grid md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-4">
          <SectionHeading number="01" label="About" title="About me" />
        </div>

        <div className="md:col-span-8">
          <div className="space-y-6 text-lg text-stone-700 leading-relaxed">
            {PERSONAL_INFO.summary.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-10 font-display text-4xl md:text-5xl leading-tight text-primary-700">
            {PERSONAL_INFO.summaryEmphasis}
          </p>

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

                    {award.badges && award.badges.length > 0 && (
                      <div className="mb-3 flex gap-2">
                        {award.badges.map((badge) => (
                          <div
                            key={badge.src}
                            className="p-1.5 bg-white rounded-md overflow-hidden border border-stone-200"
                          >
                            <img
                              src={badge.src}
                              alt={badge.alt}
                              width={48}
                              height={48}
                              loading="lazy"
                              className="w-12 h-12 object-contain scale-150"
                            />
                          </div>
                        ))}
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

          {/* Outside Work Subsection */}
          <div className="mt-16">
            <h3 className={SUBHEADING_CLASS}>Outside work</h3>
            <p className="font-display text-2xl md:text-3xl leading-snug text-ink mb-8">
              {OUTSIDE_WORK_MOTTO}
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {OUTSIDE_WORK.map((group) => (
                <div
                  key={group.id}
                  className="flex items-start gap-3 border-t border-stone-300 pt-5"
                >
                  <span className="text-primary-700 mt-0.5">{group.icon}</span>
                  <p className="text-stone-700 leading-relaxed">{group.items.join(' · ')}</p>
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
