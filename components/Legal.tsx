/**
 * @fileoverview Combined Legal Disclaimer page.
 * @description Lightweight legal notice covering privacy and terms.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import { SOCIAL_LINKS } from '../constants';
import { Shield, FileText, Copyright, ExternalLink, Mail, ArrowLeft } from 'lucide-react';

const EFFECTIVE_DATE = 'January 5, 2026';

interface LegalSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const LegalSection: React.FC<LegalSectionProps> = memo(({ icon, title, children }) => (
  <div className="group">
    <div className="flex items-center gap-3 mb-3">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl 
                      bg-slate-800/80 text-primary-400 group-hover:bg-primary-500/20 
                      transition-colors duration-300"
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    <div className="pl-13 text-slate-400 leading-relaxed">{children}</div>
  </div>
));

LegalSection.displayName = 'LegalSection';

const Legal: React.FC = memo(() => {
  const linkedInUrl = SOCIAL_LINKS.find((link) => link.platform === 'LinkedIn')?.url;

  return (
    <Section id="legal" className="pt-28 md:pt-36 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                          bg-gradient-to-br from-primary-500/20 to-primary-600/10 
                          border border-primary-500/30 mb-6"
          >
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Legal &amp; Privacy
          </h1>
          <p className="mt-4 text-slate-400">
            Effective: <span className="text-slate-300">{EFFECTIVE_DATE}</span>
          </p>
        </div>

        {/* Intro Card */}
        <div
          className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                        backdrop-blur-sm mb-8 text-center"
        >
          <p className="text-slate-300">
            This is a personal portfolio site. By using it, you agree to the following terms.
          </p>
        </div>

        {/* Sections Grid */}
        <div className="space-y-8">
          <div
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                          backdrop-blur-sm hover:border-slate-700 transition-colors"
          >
            <LegalSection icon={<Shield className="w-5 h-5" />} title="Privacy">
              <p>
                This site uses Google Analytics (GA4) to understand visitor behavior. GA4 may
                collect anonymized usage data such as pages visited and time on site. No personal
                data is shared with third parties beyond Google. The hosting provider (Cloudflare)
                may log standard request data (IP, user agent, timestamps) to operate the service.
                If you contact me, I retain only what's needed to respond.
              </p>
            </LegalSection>
          </div>

          <div
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                          backdrop-blur-sm hover:border-slate-700 transition-colors"
          >
            <LegalSection icon={<FileText className="w-5 h-5" />} title="Content & Liability">
              <p>
                Content is for informational purposes only—not professional advice. The site is
                provided "as is" without warranties. I'm not liable for any damages from your use of
                this site.
              </p>
            </LegalSection>
          </div>

          <div
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                          backdrop-blur-sm hover:border-slate-700 transition-colors"
          >
            <LegalSection icon={<Copyright className="w-5 h-5" />} title="Intellectual Property">
              <p>
                Unless stated otherwise, content is mine or used with permission. Feel free to share
                links, but don't republish substantial portions without asking.
              </p>
            </LegalSection>
          </div>

          <div
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                          backdrop-blur-sm hover:border-slate-700 transition-colors"
          >
            <LegalSection icon={<ExternalLink className="w-5 h-5" />} title="External Links">
              <p>
                Links to third-party sites are provided for convenience. I'm not responsible for
                their content or privacy practices.
              </p>
            </LegalSection>
          </div>

          <div
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 
                          backdrop-blur-sm hover:border-slate-700 transition-colors"
          >
            <LegalSection icon={<Mail className="w-5 h-5" />} title="Contact">
              <p>
                Questions? Reach me via{' '}
                {linkedInUrl ? (
                  <a
                    className="text-primary-400 hover:text-primary-300 underline 
                               underline-offset-4 transition-colors"
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                ) : (
                  'LinkedIn'
                )}
                .
              </p>
            </LegalSection>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-slate-800/80 text-slate-300 hover:text-white 
                       hover:bg-slate-700/80 transition-all duration-300
                       border border-slate-700 hover:border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </a>
        </div>
      </div>
    </Section>
  );
});

Legal.displayName = 'Legal';

export default Legal;
