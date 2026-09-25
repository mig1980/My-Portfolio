/**
 * @fileoverview Combined Legal Disclaimer page.
 * @description Lightweight legal notice covering privacy and terms.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import { SOCIAL_LINKS } from '../constants';
import { Shield, FileText, Copyright, ExternalLink, Mail, ArrowLeft } from 'lucide-react';

const EFFECTIVE_DATE = 'January 5, 2026';

/** Card surface for each legal section */
const LEGAL_CARD_CLASS = 'p-6 rounded-lg border border-stone-200 bg-white';

interface LegalSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const LegalSection: React.FC<LegalSectionProps> = memo(({ icon, title, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary-50 text-primary-700">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
    </div>
    <div className="pl-13 text-stone-700 leading-relaxed">{children}</div>
  </div>
));

LegalSection.displayName = 'LegalSection';

const Legal: React.FC = memo(() => {
  const linkedInUrl = SOCIAL_LINKS.find((link) => link.platform === 'LinkedIn')?.url;

  return (
    <Section id="legal" className="pt-28 md:pt-36 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-600 mb-4">
            <Shield className="inline w-4 h-4 mr-2 -mt-0.5 text-primary-700" aria-hidden="true" />
            Legal
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-ink tracking-tight">
            Legal &amp; Privacy
          </h1>
          <p className="mt-4 text-stone-600">
            Effective: <span className="text-ink">{EFFECTIVE_DATE}</span>
          </p>
        </div>

        {/* Intro */}
        <p className="mb-8 text-lg text-stone-700">
          This is a personal portfolio site. By using it, you agree to the following terms.
        </p>

        {/* Sections Grid */}
        <div className="space-y-4">
          <div className={LEGAL_CARD_CLASS}>
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

          <div className={LEGAL_CARD_CLASS}>
            <LegalSection icon={<FileText className="w-5 h-5" />} title="Content & Liability">
              <p>
                Content is for informational purposes only—not professional advice. The site is
                provided "as is" without warranties. I'm not liable for any damages from your use of
                this site.
              </p>
            </LegalSection>
          </div>

          <div className={LEGAL_CARD_CLASS}>
            <LegalSection icon={<Copyright className="w-5 h-5" />} title="Intellectual Property">
              <p>
                Unless stated otherwise, content is mine or used with permission. Feel free to share
                links, but don't republish substantial portions without asking.
              </p>
            </LegalSection>
          </div>

          <div className={LEGAL_CARD_CLASS}>
            <LegalSection icon={<ExternalLink className="w-5 h-5" />} title="External Links">
              <p>
                Links to third-party sites are provided for convenience. I'm not responsible for
                their content or privacy practices.
              </p>
            </LegalSection>
          </div>

          <div className={LEGAL_CARD_CLASS}>
            <LegalSection icon={<Mail className="w-5 h-5" />} title="Contact">
              <p>
                Questions? Reach me via{' '}
                {linkedInUrl ? (
                  <a
                    className="text-primary-700 hover:text-primary-800 underline underline-offset-4 transition-colors focus-ring-inset rounded-sm"
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
        <div className="mt-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-stone-400 hover:border-ink text-ink font-semibold transition-colors focus-ring"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to site
          </a>
        </div>
      </div>
    </Section>
  );
});

Legal.displayName = 'Legal';

export default Legal;
