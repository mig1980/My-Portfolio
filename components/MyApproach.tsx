/**
 * @fileoverview "How I think" section.
 * @description Four working principles plus a closing editorial statement.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { Layers, Telescope, Users, Hammer } from 'lucide-react';

/**
 * Working principle.
 */
interface ApproachStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

const APPROACH_STEPS: ApproachStep[] = [
  {
    icon: Layers,
    title: 'Go deep',
    description: 'Understand the technology well enough to challenge assumptions.',
  },
  {
    icon: Telescope,
    title: 'Zoom out',
    description: 'Find the business problem behind the technology conversation.',
  },
  {
    icon: Users,
    title: 'Connect the room',
    description: 'Create alignment across people with different priorities and incentives.',
  },
  {
    icon: Hammer,
    title: 'Make it real',
    description: 'Turn strategy into commitments, execution, and measurable outcomes.',
  },
];

/** Closing statement, one line per element */
const STATEMENT_LINES: readonly string[] = [
  'Go deep enough to understand the technology.',
  'Go high enough to understand the business.',
  'Stay close enough to make it happen.',
];

/**
 * "How I think" section.
 * Features:
 * - 4 numbered principle columns
 * - Large editorial statement
 * - Responsive grid layout
 *
 * @returns The principles section
 */
const MyApproach: React.FC = memo(() => {
  return (
    <Section id="approach" darker>
      <SectionHeading number="02" label="Principles" title="How I think." className="mb-14" />

      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        {APPROACH_STEPS.map((step, idx) => (
          <li key={step.title} className="border-t-2 border-ink pt-5">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-5xl leading-none text-stone-500 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <step.icon className="w-6 h-6 text-primary-700" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">{step.title}</h3>
            <p className="text-stone-700 leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>

      <p className="mt-20 max-w-4xl font-display text-3xl md:text-5xl leading-tight text-ink">
        {STATEMENT_LINES.map((line, idx) => (
          <span
            key={line}
            className={`block ${idx === STATEMENT_LINES.length - 1 ? 'text-primary-700' : ''}`}
          >
            {line}
          </span>
        ))}
      </p>
    </Section>
  );
});

MyApproach.displayName = 'MyApproach';

export default MyApproach;
