/**
 * @fileoverview About section component with personal summary and awards.
 * @description Displays biographical information, awards, and personal interests.
 */

import React from 'react';
import Section from './ui/Section';
import { PERSONAL_INFO, AWARDS, INTERESTS } from '../constants';
import { Trophy, Award, Medal, ArrowUpRight, Heart } from 'lucide-react';

/**
 * About section component displaying personal information.
 * Features:
 * - Personal summary
 * - Awards and recognition grid with visual tiers (platinum/gold/blue)
 * - Personal interests showcase
 *
 * @returns The about section with bio, awards, and interests
 */
const About: React.FC = () => {
  return (
    <Section id="about" darker>
      <div className="grid md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-4">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-1 bg-primary-500 rounded-full"></span>
            About Me
          </h2>
          <div className="text-slate-300 space-y-4">
            <p className="font-medium text-slate-200">Based in {PERSONAL_INFO.location}.</p>
            <p>
              Colleagues know me as someone who listens first, gives honest advice, and turns
              complex challenges into actionable plans.
            </p>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="relative bg-slate-800/30 rounded-2xl p-8 border border-slate-800">
            <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
              {PERSONAL_INFO.summary.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Awards & Recognition Subsection */}
          <div className="mt-12">
            <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Honors & Achievements
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AWARDS.map((award, idx) => {
                // Determine style based on award color type
                let accentColor = 'text-primary-400';
                let borderColor = 'hover:border-primary-500/50';
                let bgGradient = 'hover:bg-slate-800';
                let icon = <Award className="w-6 h-6" />;

                if (award.color === 'platinum') {
                  accentColor = 'text-slate-200';
                  borderColor = 'hover:border-slate-300/50';
                  bgGradient =
                    'bg-gradient-to-br from-slate-800/50 to-slate-900 hover:from-slate-700/50 hover:to-slate-800';
                  icon = <Trophy className="w-6 h-6" />;
                } else if (award.color === 'gold') {
                  accentColor = 'text-yellow-500';
                  borderColor = 'hover:border-yellow-500/50';
                  bgGradient =
                    'bg-gradient-to-br from-slate-900 to-yellow-900/10 hover:from-slate-800 hover:to-yellow-900/20';
                  icon = <Medal className="w-6 h-6" />;
                }

                return (
                  <div
                    key={idx}
                    className={`
                      group relative p-5 rounded-xl border border-slate-800 bg-slate-900/50 
                      transition-all duration-300 ${borderColor} ${bgGradient}
                    `}
                  >
                    {award.link && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className={`w-4 h-4 ${accentColor}`} />
                      </div>
                    )}

                    <div
                      className={`mb-3 ${accentColor} p-2 bg-slate-950/50 rounded-lg inline-block`}
                    >
                      {icon}
                    </div>

                    <h4 className="text-slate-100 font-bold text-lg mb-1 group-hover:text-white transition-colors">
                      {award.title}
                    </h4>

                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      {award.issuer} • <span className={accentColor}>{award.awardLevel}</span>
                    </div>

                    <p className="text-sm text-slate-400 leading-snug">{award.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interests Subsection */}
          <div className="mt-12">
            <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-6 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Personal Interests
            </h3>
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((interest, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/30 border border-slate-800 rounded-full text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800/50 transition-all cursor-default"
                >
                  <span className="text-primary-400">{interest.icon}</span>
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default About;
