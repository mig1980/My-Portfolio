/**
 * @fileoverview My Approach section showcasing methodology.
 * @description Displays strategic approach cards that differentiate the professional brand.
 */

import { memo } from 'react';
import Section from './ui/Section';
import { Search, Users, Rocket, TrendingUp } from 'lucide-react';

/**
 * Approach methodology step.
 */
interface ApproachStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const APPROACH_STEPS: ApproachStep[] = [
  {
    icon: Search,
    title: 'Discovery',
    description:
      'Listen with empathy to understand the real business challenge, not just the stated problem.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Users,
    title: 'Alignment',
    description: 'Build trust and consensus across stakeholders with a shared vision for success.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Rocket,
    title: 'Execution',
    description:
      'Deliver on promises with speed and precision—reliability earns lasting partnerships.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: TrendingUp,
    title: 'Scale',
    description: 'Grow relationships into long-term partnerships that outlast any single deal.',
    color: 'from-amber-500 to-amber-600',
  },
];

/**
 * My Approach section displaying methodology cards.
 * Features:
 * - 4-step methodology visualization
 * - Icon-driven cards with gradient accents
 * - Responsive grid layout
 *
 * @returns The approach methodology section
 */
const MyApproach: React.FC = memo(() => {
  return (
    <Section id="approach" darker>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How I Work</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Two decades of enterprise sales taught me that lasting partnerships are built on
            understanding, alignment, and relentless execution.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {APPROACH_STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group relative p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-300"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-7 h-7 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                {idx + 1}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <step.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
});

MyApproach.displayName = 'MyApproach';

export default MyApproach;
