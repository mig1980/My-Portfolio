/**
 * @fileoverview My Approach section showcasing methodology.
 * @description Displays strategic approach cards that differentiate the professional brand.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { Search, Users, Rocket, TrendingUp } from 'lucide-react';

/**
 * Approach methodology step.
 */
interface ApproachStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

const APPROACH_STEPS: ApproachStep[] = [
  {
    icon: Search,
    title: 'Discovery',
    description:
      'Listen with empathy to understand the real business challenge, not just the stated problem.',
  },
  {
    icon: Users,
    title: 'Alignment',
    description: 'Build trust and consensus across stakeholders with a shared vision for success.',
  },
  {
    icon: Rocket,
    title: 'Execution',
    description:
      'Deliver on promises with speed and precision—reliability earns lasting partnerships.',
  },
  {
    icon: TrendingUp,
    title: 'Scale',
    description: 'Grow relationships into long-term partnerships that outlast any single deal.',
  },
];

/**
 * My Approach section displaying methodology cards.
 * Features:
 * - 4-step numbered methodology columns
 * - Philosophy pull quote
 * - Responsive grid layout
 *
 * @returns The approach methodology section
 */
const MyApproach: React.FC = memo(() => {
  return (
    <Section id="approach" darker>
      <SectionHeading
        number="02"
        label="Approach"
        title="How I work"
        intro="Two decades of enterprise sales taught me that lasting partnerships are built on understanding, alignment, and relentless execution."
        className="mb-14"
      />

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

      {/* Philosophy Quote */}
      <figure className="mt-20 max-w-4xl">
        <blockquote className="font-display text-3xl md:text-4xl italic leading-snug text-ink">
          &ldquo;Good salespeople sell features—what the product does. Great salespeople sell
          outcomes—how it benefits the customer. Truly great salespeople sell feelings—the emotional
          impact of the purchase.&rdquo;
        </blockquote>
        <figcaption className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-stone-600">
          — Robert Herjavec
        </figcaption>
      </figure>
    </Section>
  );
});

MyApproach.displayName = 'MyApproach';

export default MyApproach;
