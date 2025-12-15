/**
 * @fileoverview Thought Leadership section for articles and publications.
 * @description Showcases written content, talks, and intellectual contributions.
 */

import { memo } from 'react';
import Section from './ui/Section';
import { THOUGHT_LEADERSHIP } from '../constants';
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

  return (
    <Section id="thoughts" darker>
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Thought Leadership
        </h2>
      </div>

      {/* QuantumInvestor Card */}
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm hover:border-primary-500/50 hover:bg-slate-800/80 transition-all duration-300">
            {/* Logo & Title Row */}
            <div className="flex items-start gap-5 mb-6">
              <img
                src="/LogoQI.png"
                alt="QuantumInvestor logo"
                className="w-16 h-16 rounded-xl object-contain flex-shrink-0"
              />
              <div>
                <a
                  href="https://quantuminvestor.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold text-white hover:text-primary-300 transition-colors"
                >
                  QuantumInvestor.net
                </a>
                <p className="text-sm text-slate-400 mt-1">
                  Personal Project • Live AI Investment Experiment
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 mb-8 leading-relaxed">
              Can AI pick stocks better than expensive advisors? I&apos;m finding out publicly.
              Weekly picks, documented performance, transparent results. No paywalls, no hype.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-6">
              <a
                href="https://quantuminvestor.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-900 hover:bg-white rounded-lg font-semibold transition-colors"
              >
                Follow the experiment
              </a>

              {quantumInvestor?.link && quantumInvestor.link !== '#' && (
                <a
                  href={quantumInvestor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Docs
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-slate-500 italic">Not financial advice.</p>
          </div>
        </div>
    </Section>
  );
});

ThoughtLeadership.displayName = 'ThoughtLeadership';

export default ThoughtLeadership;
