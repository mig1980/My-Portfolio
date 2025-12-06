import React from 'react';
import Section from './ui/Section';
import { EDUCATION, CERTIFICATIONS } from '../constants';
import { GraduationCap, Award } from 'lucide-react';

const Education: React.FC = () => {
  return (
    <Section id="education" darker>
      <div className="grid md:grid-cols-2 gap-16">
        {/* Education Column */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <GraduationCap className="text-primary-500" />
            Education
          </h3>
          <div className="space-y-8">
            {EDUCATION.map((edu, idx) => (
              <div key={idx} className="pl-6 border-l-2 border-slate-800 relative">
                <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                <h4 className="text-lg font-bold text-slate-200">{edu.institution}</h4>
                <p className="text-slate-400">{edu.degree}</p>
                <span className="text-xs text-slate-500 uppercase tracking-wider mt-1 block">{edu.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Column */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Award className="text-primary-500" />
            Certifications
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {CERTIFICATIONS.map((cert, idx) => (
              <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors">
                <h4 className="font-semibold text-slate-200 text-sm mb-1">{cert.name}</h4>
                <p className="text-xs text-slate-500">{cert.issuer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Education;