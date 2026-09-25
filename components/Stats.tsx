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
    <section className="relative py-16 md:py-20 bg-ink text-paper" aria-label="Key Statistics">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-700">
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
    </section>
  );
});

Stats.displayName = 'Stats';

export default Stats;
