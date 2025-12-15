/**
 * @fileoverview StatCounter component for animated statistic display.
 * @description Displays a single statistic with animated counting effect.
 */

import { memo } from 'react';
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
      <div
        ref={ref}
        className="flex flex-col items-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-primary-500/30 transition-colors"
      >
        <div className="text-4xl md:text-5xl font-bold text-white mb-2">
          <span className="text-primary-400">{prefix}</span>
          <span>{count}</span>
          <span className="text-primary-400">{suffix}</span>
        </div>
        <div className="text-slate-400 text-sm md:text-base font-medium text-center">{label}</div>
      </div>
    );
  }
);

StatCounter.displayName = 'StatCounter';

export default StatCounter;
