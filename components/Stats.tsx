/**
 * @fileoverview Stats section component for key achievement highlights.
 * @description Displays animated statistics showcasing career achievements.
 */

import React, { memo } from 'react';
import StatCounter from './ui/StatCounter';
import { STATS } from '../constants';

/**
 * Stats section component displaying animated achievement counters.
 * Features:
 * - Animated counting effect when scrolled into view
 * - Responsive grid layout (1 column mobile, 3 columns desktop)
 * - Memoized for performance optimization
 *
 * @returns The stats section with animated counters
 */
const Stats: React.FC = memo(() => {
  return (
    <section className="relative py-16 md:py-20 bg-slate-950" aria-label="Key Statistics">
      {/* Subtle gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <StatCounter
              key={stat.label}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              label={stat.label}
              duration={2000}
            />
          ))}
        </div>
      </div>

      {/* Subtle gradient divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
    </section>
  );
});

Stats.displayName = 'Stats';

export default Stats;
