/**
 * @fileoverview Expertise section component ("Where I operate").
 * @description Editorial index: one ruled row per area, items in two columns.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { SKILLS } from '../constants';

/**
 * Expertise section component.
 * Features:
 * - One full-width row per area, separated by hairline rules
 * - Area name in display serif, items in a two-column list
 *
 * @returns The expertise section
 */
const Expertise: React.FC = memo(() => {
  return (
    <Section id="expertise">
      <SectionHeading number="03" label="Expertise" title="Where I operate." className="mb-14" />

      <div className="border-b border-stone-300">
        {SKILLS.map((group) => (
          <div
            key={group.category}
            className="grid md:grid-cols-12 gap-5 md:gap-8 py-8 md:py-10 border-t border-stone-300"
          >
            <h3 className="md:col-span-4 lg:col-span-3 font-display text-3xl md:text-4xl leading-none text-ink">
              {group.category}
            </h3>
            <ul className="md:col-span-8 lg:col-span-9 grid sm:grid-cols-2 gap-x-10 gap-y-3">
              {group.skills.map((skill) => (
                <li key={skill} className="flex gap-3 text-lg text-stone-700 leading-snug">
                  <span
                    className="mt-[0.7em] w-4 h-px bg-primary-700 shrink-0"
                    aria-hidden="true"
                  />
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
});

Expertise.displayName = 'Expertise';

export default Expertise;
