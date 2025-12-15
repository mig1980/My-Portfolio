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
    <Section id="thoughts">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Thought Leadership</h2>

          {/* QuantumInvestor Card */}
          <div className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/LogoQI.png"
                alt="QuantumInvestor logo"
                className="w-14 h-14 rounded-lg object-contain"
              />
              <div>
                <a
                  href="https://quantuminvestor.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-white hover:text-primary-300 transition-colors"
                >
                  QuantumInvestor.net
                </a>
                <p className="text-xs text-slate-500">
                  Personal Project • Live AI Investment Experiment
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-4">
              Can AI pick stocks better than expensive advisors? I&apos;m finding out publicly.
              Weekly picks, documented performance, transparent results. No paywalls, no hype.
            </p>

            <p className="text-xs text-slate-500 mb-5 italic">
              Not financial advice. An experiment you can follow along with.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://quantuminvestor.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 text-slate-900 hover:bg-white rounded-lg font-semibold text-sm transition-colors"
              >
                Follow the experiment
              </a>

              {quantumInvestor?.link && quantumInvestor.link !== '#' && (
                <a
                  href={quantumInvestor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Docs
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
});

ThoughtLeadership.displayName = 'ThoughtLeadership';

export default ThoughtLeadership;
