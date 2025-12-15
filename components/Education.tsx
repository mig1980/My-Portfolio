/**
 * @fileoverview Education section component with qualifications and certifications.
 * @description Displays educational background and professional certifications.
 */

import { memo } from 'react';
import Section from './ui/Section';
import { EDUCATION, CERTIFICATIONS } from '../constants';
import { GraduationCap, Award, ExternalLink } from 'lucide-react';

/**
 * Education section component displaying academic and professional credentials.
 * Features:
 * - Two-column layout (education | certifications)
 * - Timeline-style education entries
 * - Grid of certification cards
 * - Memoized for performance optimization
 *
 * @returns The education section with degrees and certifications
 */
const Education: React.FC = memo(() => {
  return (
    <Section id="education">
      <div className="grid md:grid-cols-2 gap-16">
        {/* Education Column */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <GraduationCap className="text-primary-500" />
            Education
          </h3>
          <div className="space-y-8">
            {EDUCATION.map((edu, idx) => {
              // Get initials from institution name
              const getInitials = (name: string): string => {
                const words = name.split(' ').filter((word) => word.length > 0);
                if (words.length >= 2) {
                  return (words[0]![0]! + words[1]![0]!).toUpperCase();
                }
                return name.substring(0, 2).toUpperCase();
              };

              const CardWrapper = edu.url ? 'a' : 'div';
              const cardProps = edu.url
                ? {
                    href: edu.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  }
                : {};

              return (
                <CardWrapper
                  key={idx}
                  {...cardProps}
                  className={`
                    pl-6 border-l-2 border-slate-800 relative block
                    ${edu.url ? 'cursor-pointer group hover:border-slate-600 transition-colors' : ''}
                  `}
                >
                  <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                  <div className="flex items-start gap-3">
                    {/* Logo with fallback */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {edu.logo ? (
                        <img
                          src={edu.logo}
                          alt={`${edu.institution} logo`}
                          className="w-10 h-10 rounded object-contain bg-white p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`
                          w-10 h-10 rounded bg-gradient-to-br from-slate-700 to-slate-800 
                          flex items-center justify-center text-xs font-bold text-slate-300
                          ${edu.logo ? 'hidden absolute inset-0' : ''}
                        `}
                      >
                        {getInitials(edu.institution)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        {edu.institution}
                        {edu.url && (
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                        )}
                      </h4>
                      <p className="text-slate-400">{edu.degree}</p>
                      <span className="text-xs text-slate-500 uppercase tracking-wider mt-1 block">
                        {edu.type}
                      </span>
                    </div>
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>

        {/* Certifications Column */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Award className="text-primary-500" />
            Certifications
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {CERTIFICATIONS.map((cert, idx) => {
              // Get initials from issuer name
              const getInitials = (name: string): string => {
                const words = name.split(' ').filter((word) => word.length > 0);
                if (words.length >= 2) {
                  return (words[0]![0]! + words[1]![0]!).toUpperCase();
                }
                return name.substring(0, 2).toUpperCase();
              };

              const CardWrapper = cert.url ? 'a' : 'div';
              const cardProps = cert.url
                ? {
                    href: cert.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  }
                : {};

              return (
                <CardWrapper
                  key={idx}
                  {...cardProps}
                  className={`
                    p-4 bg-slate-900 border border-slate-800 rounded-lg 
                    hover:border-slate-600 transition-colors flex items-start gap-3
                    ${cert.url ? 'cursor-pointer group' : ''}
                  `}
                >
                  {/* Logo with fallback */}
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {cert.logo ? (
                      <img
                        src={cert.logo}
                        alt={`${cert.issuer} logo`}
                        className="w-8 h-8 rounded object-contain bg-white p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement).nextElementSibling;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`
                        w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-800 
                        flex items-center justify-center text-xs font-bold text-slate-300
                        ${cert.logo ? 'hidden absolute inset-0' : ''}
                      `}
                    >
                      {cert.issuer ? getInitials(cert.issuer) : 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-2">
                      {cert.name}
                      {cert.url && (
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-primary-400 transition-colors" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">{cert.issuer}</p>
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div className="mt-12 pt-8 border-t border-slate-800/50">
          <p className="text-slate-400 text-sm">
            <span className="text-slate-500">Languages:</span> English • Russian
          </p>
        </div>
      </div>
    </Section>
  );
});

Education.displayName = 'Education';

export default Education;
