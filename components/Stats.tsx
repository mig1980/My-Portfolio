/**
 * @fileoverview Stats section component for key achievement highlights.
 * @description Displays key statistics showcasing career achievements.
 */

import React, { memo } from 'react';
import StatCounter from './ui/StatCounter';
import { STATS } from '../constants';
import { useInView } from '../hooks/useInView';

/** Delay between each stat fading in (ms) */
const STAGGER_MS = 120;

/**
 * Stats section component displaying achievement figures.
 * Features:
 * - Final values always rendered (no count-up), so every load shows the same numbers
 * - Staggered fade-in when scrolled into view
 * - Responsive grid layout (1 column mobile, 3 columns desktop)
 *
 * @returns The stats section
 */
const Stats: React.FC = memo(() => {
  const [ref, isVisible] = useInView();

  return (
    <section
      ref={ref}
      className="relative py-14 md:py-16 bg-ink text-paper"
      aria-label="Key Statistics"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-700">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 motion-reduce:opacity-100 motion-reduce:translate-y-0'
              }`}
              style={{ transitionDelay: `${index * STAGGER_MS}ms` }}
            >
              <StatCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={stat.label}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

Stats.displayName = 'Stats';

export default Stats;
