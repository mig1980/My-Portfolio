/**
 * @fileoverview My Approach section showcasing methodology.
 * @description Displays strategic approach cards that differentiate the professional brand.
 */

import { memo } from 'react';
import Section from './ui/Section';
import { Search, Users, Rocket, TrendingUp, Quote } from 'lucide-react';

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
 * - Connected timeline between steps
 * - Icon-driven cards with gradient accents
 * - Philosophy quote
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

        {/* Step Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {APPROACH_STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group relative p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-800/60 transition-all duration-300"
            >
              {/* Step number with gradient ring */}
              <div
                className={`absolute -top-4 left-6 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:border-transparent group-hover:bg-gradient-to-br ${step.color} group-hover:text-white transition-all duration-300`}
              >
                {idx + 1}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 mt-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
              >
                <step.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Philosophy Quote */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-start gap-4 max-w-3xl mx-auto p-8 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
            <Quote className="w-8 h-8 text-primary-500 flex-shrink-0 mt-1" />
            <blockquote className="text-left">
              <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed">
                Good salespeople sell features—what the product does. Great salespeople sell
                outcomes—how it benefits the customer. Truly great salespeople sell feelings—the
                emotional impact of the purchase.
              </p>
              <footer className="mt-4 text-sm text-slate-500">— Robert Herjavec</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </Section>
  );
});

MyApproach.displayName = 'MyApproach';

export default MyApproach;
