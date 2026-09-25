/**
 * @fileoverview StatCounter component for animated statistic display.
 * @description Displays a single statistic with animated counting effect.
 */

import React, { memo } from 'react';
import type { StatItem } from '../../types';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * Props for the StatCounter component.
 */
interface StatCounterProps extends StatItem {
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * A single animated statistic counter.
 * Animates from 0 to the target value when scrolled into view.
 *
 * @param props - Component props
 * @returns An animated statistic display
 *
 * @example
 * ```tsx
 * <StatCounter
 *   value={250}
 *   prefix="$"
 *   suffix="M+"
 *   label="Total Contract Value"
 *   duration={2000}
 * />
 * ```
 */
const StatCounter: React.FC<StatCounterProps> = memo(
  ({ value, prefix = '', suffix = '', label, duration = 2000 }) => {
    const { count, ref } = useCountUp({ end: value, duration });

    return (
      <div ref={ref} className="flex flex-col items-center px-6 py-8 md:py-4">
        <div className="font-display text-6xl md:text-7xl leading-none text-paper mb-3 tabular-nums">
          <span className="text-primary-300">{prefix}</span>
          <span>{count}</span>
          <span className="text-primary-300">{suffix}</span>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400 text-center">
          {label}
        </div>
      </div>
    );
  }
);

StatCounter.displayName = 'StatCounter';

export default StatCounter;
