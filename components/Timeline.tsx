/**
 * @fileoverview Interactive Timeline section for career journey visualization.
 * @description Displays work history as an interactive vertical timeline.
 */

import React, { memo, useState, useCallback } from 'react';
import Section from './ui/Section';
import TimelineItem from './ui/TimelineItem';
import { EXPERIENCE } from '../constants';

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
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Professional Journey</h2>
          <p className="text-slate-300">
            From hands-on engineering to enterprise dealmaking—click any role to explore the story.
          </p>
        </div>
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
            <div className="text-xs font-bold text-slate-600 mb-1 md:mb-2 w-10 md:w-12 text-center">
              Start
            </div>
            <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-700" />
          </div>
          <div className="text-sm text-slate-600 italic pt-1">Where it all began...</div>
        </div>
      </div>
    </Section>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;
