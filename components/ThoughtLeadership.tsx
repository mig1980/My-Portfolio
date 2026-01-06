/**
 * @fileoverview Thought Leadership section for articles and publications.
 * @description Showcases written content, talks, and intellectual contributions.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import { THOUGHT_LEADERSHIP } from '../constants';
import { getLogoUrl } from '../utils/logo';
import { ExternalLink } from 'lucide-react';

/**
 * Thought Leadership section component for showcasing publications.
 * Features:
 * - Compact card layout
 * - Featured blog promotion with logo
 * - Memoized for performance optimization
 *
 * @returns The thought leadership section with articles and blog CTA
 */
const ThoughtLeadership: React.FC = memo(() => {
  const quantumInvestor = THOUGHT_LEADERSHIP.find((item) =>
    item.link?.includes('quantuminvestor.net')
  );

  const portfolioRepoUrl = 'https://github.com/mig1980/My-Portfolio';

  return (
    <Section id="thoughts" darker>
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What I'm Building</h2>
      </div>

      {/* QuantumInvestor Card */}
      <div className="max-w-3xl mx-auto">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-800/30 transition-colors duration-300 hover:border-slate-700">
          {/* Logo & Title Row */}
          <div className="flex items-center gap-4 mb-4">
            <a
              href="https://quantuminvestor.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <img
                src="/LogoQI.png"
                alt="QuantumInvestor logo"
                loading="lazy"
                className="w-14 h-14 rounded-lg object-contain hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="flex flex-col justify-center">
              <a
                href="https://quantuminvestor.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-white hover:text-primary-400 transition-colors"
              >
                QuantumInvestor.net
              </a>
              <p className="text-xs text-slate-400 mt-0.5">
                Personal Project • Live AI Investment Experiment
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-300 text-sm mb-5 leading-relaxed">
            Can AI pick stocks better than expensive advisors? I&apos;m finding out publicly. Weekly
            picks, documented performance, transparent results. No paywalls, no hype.
          </p>

          {/* CTAs - matching Hero button styles */}
          <div className="flex flex-wrap gap-3 mb-4">
            <a
              href="https://quantuminvestor.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg font-semibold transition-colors"
            >
              Follow the experiment
            </a>

            {quantumInvestor?.link && quantumInvestor.link !== '#' && (
              <a
                href={quantumInvestor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm rounded-lg font-medium transition-colors"
              >
                Docs
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 italic">Not financial advice.</p>
        </div>

        {/* GitHub Fork Card */}
        <div className="mt-4 p-5 rounded-xl border border-slate-800 bg-slate-800/30 transition-colors duration-300 hover:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <a
              href={portfolioRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <img
                src={getLogoUrl('github.com', { size: 80 })}
                alt="GitHub logo"
                loading="lazy"
                className="w-14 h-14 rounded-lg object-contain hover:opacity-80 transition-opacity invert contrast-200"
              />
            </a>
            <div className="flex flex-col justify-center">
              <a
                href={portfolioRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-white hover:text-primary-400 transition-colors"
              >
                Fork This Website
              </a>
              <p className="text-xs text-slate-400 mt-0.5">
                Open source • Make it yours in minutes
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-5 leading-relaxed">
            Want a similar portfolio website? Fork-friendly: clone, swap your content, and ship.
            Modern React + TypeScript + Tailwind stack with tests in place.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href={portfolioRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg font-semibold transition-colors"
            >
              Fork on GitHub
            </a>
            <a
              href={`${portfolioRepoUrl}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm rounded-lg font-medium transition-colors"
            >
              Setup notes
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
});

ThoughtLeadership.displayName = 'ThoughtLeadership';

export default ThoughtLeadership;
