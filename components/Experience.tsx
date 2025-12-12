/**
 * @fileoverview Experience section component with professional timeline.
 * @description Displays work history in a visual timeline format.
 */

import React from 'react';
import Section from './ui/Section';
import { EXPERIENCE } from '../constants';
import { Building2, Calendar } from 'lucide-react';

/**
 * Experience section component displaying professional work history.
 * Features:
 * - Vertical timeline layout with connecting line
 * - Company logos with fallback initials
 * - Alternating left/right layout on desktop
 * - Hover effects and animated timeline dots
 *
 * @returns The experience section with job timeline
 */
const Experience: React.FC = () => {
  return (
    <Section id="experience" darker>
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Professional Experience</h2>
        <p className="text-slate-400 max-w-2xl">
          A track record of high-stakes negotiation, strategic partnership building, and
          technological leadership.
        </p>
      </div>

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
        {EXPERIENCE.map((job, index) => (
          <div
            key={index}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 md:left-1/2 w-10 h-10 -ml-5 md:-ml-5 rounded-full border-4 border-slate-950 bg-slate-800 text-slate-400 flex items-center justify-center shadow-lg z-10 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="ml-16 md:ml-0 md:w-[45%] p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-800/60 hover:border-slate-700 transition-all">
              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-3 mb-2">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt={`${job.company} logo`}
                      className="w-8 h-8 rounded object-contain bg-white p-0.5"
                      onError={(e) => {
                        // Fallback if image fails
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
                          'hidden'
                        );
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      {job.company.substring(0, 2)}
                    </div>
                  )}
                  {/* Fallback div for when image errors, hidden by default if logo exists */}
                  {job.logo && (
                    <div className="hidden w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      {job.company.substring(0, 2)}
                    </div>
                  )}

                  <span className="text-primary-400 font-bold text-sm tracking-wider uppercase">
                    {job.company}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-100">{job.title}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                  <Calendar className="w-3 h-3" />
                  {job.period}
                </div>
              </div>

              <ul className="space-y-2">
                {job.description.map((desc, i) => (
                  <li
                    key={i}
                    className="text-slate-400 text-sm leading-relaxed flex items-start gap-2"
                  >
                    <span className="block w-1.5 h-1.5 bg-slate-600 rounded-full mt-1.5 shrink-0" />
                    {desc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Experience;
