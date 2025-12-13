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
 * - Article cards with external links
 * - Featured blog promotion card with gradient background
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Thought Leadership</h2>
          <a
            href="https://quantuminvestor.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-300 font-semibold hover:text-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
          >
            QuantumInvestor.net
          </a>
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">
            What if AI could pick stocks better than expensive advisors? I’m finding out—publicly.
          </p>
          <p className="mt-4 text-slate-400">
            I built QuantumInvestor to run a live experiment: letting generative AI manage a real
            portfolio and tracking every decision against the S&amp;P 500.
          </p>
          <p className="mt-4 text-slate-400">
            Each week, I publish the AI’s picks, document performance, and share what’s actually
            working. No paywalls, no hype—just transparent results for investors curious whether AI
            deserves a seat at the table.
          </p>
          <p className="mt-4 text-slate-500 text-sm">
            This isn’t financial advice. It’s an experiment you can follow along with.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href="https://quantuminvestor.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-900 hover:bg-white rounded-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Follow the experiment
            </a>

            {quantumInvestor?.link && quantumInvestor.link !== '#' && (
              <a
                href={quantumInvestor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                View Docs
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <a
              href="https://quantuminvestor.net/about.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white underline decoration-slate-700 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
            >
              About
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
});

ThoughtLeadership.displayName = 'ThoughtLeadership';

export default ThoughtLeadership;
