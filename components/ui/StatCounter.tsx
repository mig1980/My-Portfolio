/**
 * @fileoverview StatCounter component for statistic display.
 * @description Displays a single statistic value with its label.
 */

import React, { memo } from 'react';
import type { StatItem } from '../../types';

/**
 * A single statistic figure with label.
 *
 * @param props - Component props
 * @returns A statistic display
 *
 * @example
 * ```tsx
 * <StatCounter value={500} prefix="$" suffix="M+" label="In Multi-Year Agreements" />
 * ```
 */
const StatCounter: React.FC<StatItem> = memo(({ value, prefix = '', suffix = '', label }) => {
  return (
    <div className="flex flex-col items-center px-6 py-8 md:py-4">
      <div className="font-display text-6xl md:text-7xl leading-none text-paper mb-3 tabular-nums">
        <span className="text-primary-300">{prefix}</span>
        <span>{value}</span>
        <span className="text-primary-300">{suffix}</span>
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400 text-center">
        {label}
      </div>
    </div>
  );
});

StatCounter.displayName = 'StatCounter';

export default StatCounter;
