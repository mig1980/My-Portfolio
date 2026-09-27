/**
 * @fileoverview Interactive Timeline section for career journey visualization.
 * @description Displays work history as an interactive vertical timeline.
 */

import React, { memo, useState, useCallback } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import TimelineItem from './ui/TimelineItem';
import { EXPERIENCE, CAREER_STAGES } from '../constants';

/**
 * Interactive Timeline section component.
 * Features:
 * - Vertical timeline with year markers
 * - Click to expand/collapse job details
 * - Current role highlighted
 * - Smooth expand/collapse animations
 * - Mobile-first responsive design
 *
 * @returns The interactive career timeline section
 */
const Timeline: React.FC = memo(() => {
  // Track which items are expanded (multiple can be open)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0])); // First item open by default

  const toggleItem = useCallback((index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  return (
    <Section id="experience" darker>
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              number="04"
              label="Experience"
              title="Professional journey"
              intro="From hands-on engineering to strategic account leadership. Open any role to read the story."
            />
            <ol className="mt-10 max-w-md" aria-label="Career progression">
              {CAREER_STAGES.map((stage, idx) => (
                <li
                  key={stage.name}
                  className="flex items-baseline gap-4 py-3 border-t border-stone-300"
                >
                  <span className="font-mono text-xs text-primary-700 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-2xl leading-none text-ink">{stage.name}</span>
                  <span className="ml-auto text-sm text-stone-600 text-right">{stage.summary}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="lg:col-span-8">
          {EXPERIENCE.map((job, index) => (
            <TimelineItem
              key={job.id}
              job={job}
              isExpanded={expandedItems.has(index)}
              isCurrent={index === 0}
              onToggle={() => toggleItem(index)}
            />
          ))}

          {/* Timeline end marker */}
          <div className="flex gap-3 md:gap-6">
            <div className="flex flex-col items-center">
              <div className="font-mono text-xs text-stone-600 mb-1 md:mb-2 w-10 md:w-12 text-center">
                Start
              </div>
              <div className="w-3 h-3 rounded-full bg-paper-deep border-2 border-stone-400" />
            </div>
            <div className="text-sm text-stone-600 italic pt-1">Where it all began...</div>
          </div>
        </div>
      </div>
    </Section>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;
