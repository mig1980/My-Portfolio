/**
 * @fileoverview Education section component with qualifications and certifications.
 * @description Displays educational background and professional certifications.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import SectionHeading from './ui/SectionHeading';
import { EDUCATION, CERTIFICATIONS } from '../constants';
import { GraduationCap, Award, ExternalLink } from 'lucide-react';
import { getInitials } from '../utils/string';
import { handleImageError } from '../utils/dom';

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
      <SectionHeading
        number="05"
        label="Education"
        title="Education & credentials"
        className="mb-14"
      />
      <div className="grid md:grid-cols-2 gap-16">
        {/* Education Column */}
        <div>
          <h3 className="text-2xl font-semibold text-ink mb-8 flex items-center gap-3">
            <GraduationCap className="text-primary-700" aria-hidden="true" />
            Degrees
          </h3>
          <div className="space-y-8">
            {EDUCATION.map((edu) => {
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
                  key={edu.id}
                  {...cardProps}
                  className={`
                    pl-6 border-l-2 border-stone-300 relative block
                    ${edu.url ? 'cursor-pointer group hover:border-stone-500 transition-colors focus-ring-inset rounded-sm' : ''}
                  `}
                >
                  <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-stone-500 ring-4 ring-paper" />
                  <div className="flex items-start gap-3">
                    {/* Logo with fallback */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {edu.logo ? (
                        <img
                          src={edu.logo}
                          alt={`${edu.institution} logo`}
                          width={40}
                          height={40}
                          loading="lazy"
                          className="w-10 h-10 rounded object-contain bg-white p-1 border border-stone-200"
                          onError={handleImageError}
                        />
                      ) : null}
                      <div
                        className={`
                          w-10 h-10 rounded bg-stone-200
                          flex items-center justify-center text-xs font-bold text-stone-700
                          ${edu.logo ? 'hidden absolute inset-0' : ''}
                        `}
                      >
                        {getInitials(edu.institution)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-ink flex items-center gap-2">
                        {edu.institution}
                        {edu.url && (
                          <ExternalLink className="w-4 h-4 text-stone-500 group-hover:text-primary-700 transition-colors" />
                        )}
                      </h4>
                      <p className="text-stone-700">{edu.degree}</p>
                      <span className="font-mono text-xs text-stone-600 uppercase tracking-wider mt-1 block">
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
          <h3 className="text-2xl font-semibold text-ink mb-8 flex items-center gap-3">
            <Award className="text-primary-700" aria-hidden="true" />
            Certifications
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {CERTIFICATIONS.map((cert) => {
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
                  key={cert.id}
                  {...cardProps}
                  className={`
                    p-4 bg-white border border-stone-200 rounded-lg
                    hover:border-stone-400 transition-colors flex items-start gap-3
                    ${cert.url ? 'cursor-pointer group focus-ring-inset' : ''}
                  `}
                >
                  {/* Logo with fallback */}
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {cert.logo ? (
                      <img
                        src={cert.logo}
                        alt={`${cert.issuer} logo`}
                        width={32}
                        height={32}
                        loading="lazy"
                        className="w-8 h-8 rounded object-contain bg-white p-0.5 border border-stone-200"
                        onError={handleImageError}
                      />
                    ) : null}
                    <div
                      className={`
                        w-8 h-8 rounded bg-stone-200
                        flex items-center justify-center text-xs font-bold text-stone-700
                        ${cert.logo ? 'hidden absolute inset-0' : ''}
                      `}
                    >
                      {cert.issuer ? getInitials(cert.issuer) : 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink text-sm mb-1 flex items-center gap-2">
                      {cert.name}
                      {cert.url && (
                        <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-primary-700 transition-colors" />
                      )}
                    </h4>
                    <p className="text-xs text-stone-600">{cert.issuer}</p>
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
});

Education.displayName = 'Education';

export default Education;
