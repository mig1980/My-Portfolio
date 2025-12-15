/**
 * @fileoverview Combined Legal Disclaimer page.
 * @description Lightweight legal notice covering privacy and terms.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import Card from './ui/Card';
import { SOCIAL_LINKS } from '../constants';

const EFFECTIVE_DATE = 'December 15, 2025';

const Legal: React.FC = memo(() => {
  const linkedInUrl = SOCIAL_LINKS.find((link) => link.platform === 'LinkedIn')?.url;

  return (
    <Section id="legal" className="pt-28 md:pt-36">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Legal &amp; Privacy
        </h1>
        <p className="mt-4 text-slate-400">
          <span className="font-semibold text-slate-300">Effective:</span> {EFFECTIVE_DATE}
        </p>

        <Card hoverEffect={false} className="mt-10">
          <p className="text-slate-300">
            This is a personal portfolio site. By using it, you agree to the following terms.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Privacy</h2>
          <p className="mt-4 text-slate-300">
            I do not use analytics, tracking pixels, or cookies. The hosting provider may log
            standard request data (IP, user agent, timestamps) to operate the service. If you
            contact me, I retain only what's needed to respond.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Content &amp; Liability</h2>
          <p className="mt-4 text-slate-300">
            Content is for informational purposes only—not professional advice. The site is provided
            "as is" without warranties. I'm not liable for any damages from your use of this site.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Intellectual Property</h2>
          <p className="mt-4 text-slate-300">
            Unless stated otherwise, content is mine or used with permission. Feel free to share
            links, but don't republish substantial portions without asking.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">External Links</h2>
          <p className="mt-4 text-slate-300">
            Links to third-party sites are provided for convenience. I'm not responsible for their
            content or privacy practices.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            Questions? Reach me via{' '}
            {linkedInUrl ? (
              <a
                className="text-slate-200 underline decoration-primary-500 underline-offset-4 hover:text-white focus-ring-inset rounded-sm"
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

          <div className="mt-10">
            <a
              href="/"
              className="inline-flex items-center text-slate-300 hover:text-white transition-colors focus-ring-inset rounded-sm"
            >
              ← Back to site
            </a>
          </div>
        </Card>
      </div>
    </Section>
  );
});

Legal.displayName = 'Legal';

export default Legal;
