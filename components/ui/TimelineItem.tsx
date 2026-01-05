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
      <div className="relative flex gap-4 md:gap-6 group">
        {/* Timeline connector line */}
        <div className="flex flex-col items-center">
          {/* Year label */}
          <div className="text-xs font-bold text-slate-500 mb-2 w-12 text-center">
            {displayYear}
          </div>

          {/* Timeline dot */}
          <div
            className={`
              w-4 h-4 rounded-full border-4 z-10 transition-all duration-300
              ${
                isCurrent
                  ? 'bg-primary-500 border-primary-500/30 shadow-lg shadow-primary-500/20'
                  : isExpanded
                    ? 'bg-slate-600 border-slate-700'
                    : 'bg-slate-800 border-slate-700 group-hover:bg-slate-600'
              }
            `}
          />

          {/* Vertical line */}
          <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-700 to-slate-800/50" />
        </div>

        {/* Content card */}
        <div className="flex-1 pb-4 md:pb-8">
          <button
            onClick={onToggle}
            className={`
              w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-300
              ${
                isExpanded
                  ? 'bg-slate-800/80 border-primary-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
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
                        loading="lazy"
                        className="w-8 h-8 rounded object-contain bg-white p-0.5"
                        onError={handleImageError}
                      />
                    ) : null}
                    {/* Fallback placeholder - shown when no logo or logo fails */}
                    <div
                      className={`
                        w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-800 
                        flex items-center justify-center text-xs font-bold text-slate-300
                        ${job.logo ? 'hidden absolute inset-0' : ''}
                      `}
                    >
                      {getInitials(job.company)}
                    </div>
                  </div>

                  <div>
                    <span className="text-primary-400 font-semibold text-sm">{job.company}</span>
                    {isCurrent && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-300 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1">{job.title}</h3>

                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar className="w-3 h-3" />
                  {job.period}
                </div>
              </div>

              {/* Expand indicator */}
              <ChevronDown
                className={`
                  w-5 h-5 text-slate-500 transition-transform duration-300 flex-shrink-0 mt-1
                  ${isExpanded ? 'rotate-180' : ''}
                `}
              />
            </div>

            {/* Expandable description */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}
              `}
            >
              <ul className="space-y-2 border-t border-slate-700/50 pt-4">
                {job.description.map((desc, i) => (
                  <li
                    key={i}
                    className="text-slate-400 text-sm leading-relaxed flex items-start gap-2"
                  >
                    <span className="block w-1.5 h-1.5 bg-primary-500/60 rounded-full mt-1.5 shrink-0" />
                    {desc}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = 'TimelineItem';

export default TimelineItem;
