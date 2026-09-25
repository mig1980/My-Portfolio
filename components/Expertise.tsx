/**
 * @fileoverview Expertise section component displaying core competencies.
 * @description Shows skills organized by category in a grid layout.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import Card from './ui/Card';
import { SKILLS } from '../constants';
import { Check } from 'lucide-react';

/**
 * Expertise section component showcasing professional skills.
 * Features:
 * - Skills grouped by category with icons
 * - Bento grid: the lead category spans two columns on large screens
 * - Memoized for performance optimization
 *
 * @returns The expertise section with skill categories
 */
const Expertise: React.FC = memo(() => {
  return (
    <Section id="expertise">
      <SectionHeading
        number="03"
        label="Expertise"
        title="Core competencies"
        intro="The toolkit behind two decades of closing complex deals."
        className="mb-14"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SKILLS.map((group, index) => {
          const isLead = index === 0;
          return (
            <Card key={group.category} className={isLead ? 'md:col-span-2' : ''}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary-50 rounded-md text-primary-700">{group.icon}</div>
                <h3 className="text-xl font-semibold text-ink">{group.category}</h3>
              </div>

              <ul className={`gap-x-8 gap-y-3 ${isLead ? 'grid sm:grid-cols-2' : 'grid'}`}>
                {group.skills.map((skill) => (
                  <li key={skill} className="flex items-start gap-2 text-stone-700">
                    <Check className="w-4 h-4 text-primary-700 mt-1 shrink-0" aria-hidden="true" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </Section>
  );
});

Expertise.displayName = 'Expertise';

export default Expertise;
