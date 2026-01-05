/**
 * @fileoverview Expertise section component displaying core competencies.
 * @description Shows skills organized by category in a grid layout.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import Card from './ui/Card';
import { SKILLS } from '../constants';
import { CheckCircle2 } from 'lucide-react';

/**
 * Expertise section component showcasing professional skills.
 * Features:
 * - Skills grouped by category with icons
 * - Two-column responsive grid layout
 * - Check marks for individual skills
 * - Memoized for performance optimization
 *
 * @returns The expertise section with skill categories
 */
const Expertise: React.FC = memo(() => {
  return (
    <Section id="expertise">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Core Competencies</h2>
        <p className="text-slate-300">The toolkit behind two decades of closing complex deals.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {SKILLS.map((group) => (
          <Card
            key={group.category}
            className="h-full w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400">{group.icon}</div>
              <h3 className="text-xl font-bold text-slate-100">{group.category}</h3>
            </div>

            <div className="space-y-3">
              {group.skills.map((skill) => (
                <div key={skill} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
});

Expertise.displayName = 'Expertise';

export default Expertise;
