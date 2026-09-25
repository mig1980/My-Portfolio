/**
 * @fileoverview TimelineItem component for interactive career timeline.
 * @description Displays a single job entry with expand/collapse functionality.
 */

import React, { memo } from 'react';
import type { JobRole } from '../../types';
import { Calendar, ChevronDown } from 'lucide-react';
import { getInitials } from '../../utils/string';
import { handleImageError } from '../../utils/dom';

/**
 * Props for the TimelineItem component.
 */
interface TimelineItemProps {
  /** Job role data */
  job: JobRole;
  /** Whether this item is currently expanded */
  isExpanded: boolean;
  /** Whether this is the current/active role */
  isCurrent: boolean;
  /** Callback when item is clicked */
  onToggle: () => void;
}

/**
 * A single timeline entry with expand/collapse functionality.
 * Features:
 * - Visual timeline connector
 * - Company logo with fallback
 * - Expandable description bullets
 * - Current role indicator
 *
 * @param props - Component props
 * @returns A timeline entry component
 */
const TimelineItem: React.FC<TimelineItemProps> = memo(
  ({ job, isExpanded, isCurrent, onToggle }) => {
    // Extract year from period (e.g., "Jan 2017 - Present" → "2017")
    // For current role, show "Now" instead of start year
    const startYear = job.period.match(/\d{4}/)?.[0] || '';
    const displayYear = isCurrent ? 'Now' : startYear;

    return (
      <div className="relative flex gap-3 md:gap-6 group">
        {/* Vertical line - positioned on row, stretches with row height */}
        <div className="absolute left-5 md:left-6 top-7 md:top-8 bottom-1 md:bottom-4 w-px -translate-x-1/2 bg-stone-300" />

        {/* Timeline connector - year and dot */}
        <div className="flex flex-col items-center w-10 md:w-12 flex-shrink-0">
          {/* Year label */}
          <div className="font-mono text-xs text-stone-600 mb-1 md:mb-2 text-center">
            {displayYear}
          </div>

          {/* Timeline dot */}
          <div
            className={`
              w-3 h-3 md:w-4 md:h-4 rounded-full border-2 md:border-4 z-10 transition-colors duration-300
              ${
                isCurrent
                  ? 'bg-primary-700 border-primary-200'
                  : isExpanded
                    ? 'bg-stone-600 border-stone-300'
                    : 'bg-paper-deep border-stone-400 group-hover:bg-stone-400'
              }
            `}
          />
        </div>

        {/* Content card */}
        <div className="flex-1 pb-1 md:pb-4">
          <button
            type="button"
            onClick={onToggle}
            className={`
              w-full text-left p-3 md:p-5 rounded-lg border transition-colors duration-300 focus-ring
              ${
                isExpanded
                  ? 'bg-white border-stone-300 shadow-sm'
                  : 'bg-white/60 border-stone-200 hover:bg-white hover:border-stone-300'
              }
            `}
            aria-expanded={isExpanded}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Company logo with fallback */}
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {job.logo ? (
                      <img
                        src={job.logo}
                        alt={`${job.company} logo`}
                        width={32}
                        height={32}
                        loading="lazy"
                        className="w-8 h-8 rounded object-contain bg-white p-0.5 border border-stone-200"
                        onError={handleImageError}
                      />
                    ) : null}
                    {/* Fallback placeholder - shown when no logo or logo fails */}
                    <div
                      className={`
                        w-8 h-8 rounded bg-stone-200
                        flex items-center justify-center text-xs font-bold text-stone-700
                        ${job.logo ? 'hidden absolute inset-0' : ''}
                      `}
                    >
                      {getInitials(job.company)}
                    </div>
                  </div>

                  <div>
                    <span className="text-primary-700 font-semibold text-sm">{job.company}</span>
                    {isCurrent && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-ink mb-1">{job.title}</h3>

                <div className="flex items-center gap-2 text-stone-600 text-sm">
                  <Calendar className="w-3 h-3" aria-hidden="true" focusable="false" />
                  {job.period}
                </div>
              </div>

              {/* Expand indicator */}
              <ChevronDown
                className={`
                  w-5 h-5 text-stone-500 transition-transform duration-300 flex-shrink-0 mt-1
                  motion-reduce:transition-none
                  ${isExpanded ? 'rotate-180' : ''}
                `}
                aria-hidden="true"
                focusable="false"
              />
            </div>

            {/* Expandable description */}
            {isExpanded && (
              <div className="mt-4">
                <ul className="space-y-2 border-t border-stone-200 pt-4">
                  {job.description.map((desc, i) => (
                    <li
                      key={i}
                      className="text-stone-700 text-sm leading-relaxed flex items-start gap-2"
                    >
                      <span className="block w-1.5 h-1.5 bg-primary-700 rounded-full mt-1.5 shrink-0" />
                      {desc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = 'TimelineItem';

export default TimelineItem;
