/**
 * @fileoverview Thought Leadership section for articles and publications.
 * @description Showcases written content, talks, and intellectual contributions.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { THOUGHT_LEADERSHIP } from '../constants';
import { getLogoUrl } from '../utils/logo';
import { ExternalLink } from 'lucide-react';

/** Card surface shared by the project cards */
const CARD_CLASS =
  'flex flex-col p-6 rounded-lg border border-stone-200 bg-white transition-colors duration-300 hover:border-stone-400';

/** Primary pill button */
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center px-5 py-2.5 bg-ink hover:bg-stone-800 text-paper text-sm rounded-full font-semibold transition-colors focus-ring focus-visible:ring-offset-white';

/** Secondary outline pill button */
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-2 px-5 py-2.5 border border-stone-400 hover:border-ink text-ink text-sm rounded-full font-medium transition-colors focus-ring focus-visible:ring-offset-white';

/** Card title link */
const TITLE_LINK_CLASS =
  'text-lg font-semibold text-ink hover:text-primary-700 transition-colors focus-ring-inset rounded-sm';

/**
 * Thought Leadership section component for showcasing projects.
 * Features:
 * - Side-by-side project cards
 * - Featured blog promotion with logo
 * - Memoized for performance optimization
 *
 * @returns The projects section with QuantumInvestor and the open-source site
 */
const ThoughtLeadership: React.FC = memo(() => {
  const quantumInvestor = THOUGHT_LEADERSHIP.find((item) =>
    item.link?.includes('quantuminvestor.net')
  );

  const portfolioRepoUrl = 'https://github.com/mig1980/My-Portfolio';

  return (
    <Section id="projects">
      <SectionHeading number="05" label="Projects" title="Still building." className="mb-14" />

      <div className="grid md:grid-cols-2 gap-4">
        {/* QuantumInvestor Card */}
        <article className={CARD_CLASS}>
          <div className="flex items-center gap-4 mb-4">
            <a
              href="https://quantuminvestor.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 focus-ring-inset rounded-lg"
            >
              <img
                src="/LogoQI.png"
                alt="QuantumInvestor logo"
                width={56}
                height={56}
                loading="lazy"
                className="w-14 h-14 rounded-lg object-contain border border-stone-200 hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="flex flex-col justify-center">
              <a
                href="https://quantuminvestor.net"
                target="_blank"
                rel="noopener noreferrer"
                className={TITLE_LINK_CLASS}
              >
                QuantumInvestor.net
              </a>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-600 mt-1">
                Personal project · Live AI experiment
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-3 text-stone-700 leading-relaxed">
            <p>
              Can AI improve investment research and decision-making? I&apos;m finding out publicly.
            </p>
            <p>Weekly picks. Documented performance. Transparent results. No paywalls. No hype.</p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3">
            <a
              href="https://quantuminvestor.net"
              target="_blank"
              rel="noopener noreferrer"
              className={PRIMARY_BUTTON_CLASS}
            >
              Follow the experiment
            </a>

            {quantumInvestor?.link && quantumInvestor.link !== '#' && (
              <a
                href={quantumInvestor.link}
                target="_blank"
                rel="noopener noreferrer"
                className={SECONDARY_BUTTON_CLASS}
              >
                Docs
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            <p className="text-xs text-stone-600 italic">Not financial advice.</p>
          </div>
        </article>

        {/* GitHub Fork Card */}
        <article className={CARD_CLASS}>
          <div className="flex items-center gap-4 mb-4">
            <a
              href={portfolioRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 focus-ring-inset rounded-lg"
            >
              <img
                src={getLogoUrl('github.com', { size: 80 })}
                alt="GitHub logo"
                width={56}
                height={56}
                loading="lazy"
                className="w-14 h-14 rounded-lg object-contain border border-stone-200 hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="flex flex-col justify-center">
              <a
                href={portfolioRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={TITLE_LINK_CLASS}
              >
                This website, open source
              </a>
              <p className="font-mono text-xs uppercase tracking-wider text-stone-600 mt-1">
                Open source · Fork-friendly
              </p>
            </div>
          </div>

          <p className="text-stone-700 mb-6 leading-relaxed">
            This website is part of the experiment too. Designed, built, and open-sourced.
          </p>

          <div className="mt-auto flex flex-wrap gap-3">
            <a
              href={portfolioRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={PRIMARY_BUTTON_CLASS}
            >
              View on GitHub
            </a>
            <a
              href={`${portfolioRepoUrl}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_BUTTON_CLASS}
            >
              Setup notes
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </article>
      </div>
    </Section>
  );
});

ThoughtLeadership.displayName = 'ThoughtLeadership';

export default ThoughtLeadership;
