/**
 * @fileoverview Expertise section component ("Where I operate").
 * @description Shows four areas of work, each with a short list of topics.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import Card from './ui/Card';
import { SKILLS } from '../constants';

/**
 * Expertise section component.
 * Features:
 * - Four area cards with icons
 * - Responsive grid (1 / 2 / 4 columns)
 *
 * @returns The expertise section
 */
const Expertise: React.FC = memo(() => {
  return (
    <Section id="expertise">
      <SectionHeading number="03" label="Expertise" title="Where I operate." className="mb-14" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SKILLS.map((group) => (
          <Card key={group.category}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary-50 rounded-md text-primary-700">{group.icon}</div>
              <h3 className="text-xl font-semibold text-ink">{group.category}</h3>
            </div>

            <ul className="space-y-3 text-stone-700 leading-snug">
              {group.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
});

Expertise.displayName = 'Expertise';

export default Expertise;
