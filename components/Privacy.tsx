/**
 * @fileoverview Privacy Policy page.
 * @description Rendered inside the SPA for consistent styling.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import Card from './ui/Card';
import { SOCIAL_LINKS } from '../constants';

const EFFECTIVE_DATE = 'December 12, 2025';

const Privacy: React.FC = memo(() => {
  const linkedInUrl = SOCIAL_LINKS.find((link) => link.platform === 'LinkedIn')?.url;

  return (
    <Section id="privacy" className="pt-28 md:pt-36">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-slate-400">
          <span className="font-semibold text-slate-300">Effective date:</span> {EFFECTIVE_DATE}
        </p>

        <Card hoverEffect={false} className="mt-10">
          <p className="text-slate-300">
            This website is a personal portfolio. I value your privacy and aim to collect as little
            personal data as possible.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Information I collect</h2>
          <ul className="mt-4 list-disc pl-5 text-slate-300 space-y-2">
            <li>
              <span className="font-semibold text-slate-200">Information you provide:</span> If you
              contact me (for example, via LinkedIn), you provide whatever you include in your
              message.
            </li>
            <li>
              <span className="font-semibold text-slate-200">Basic technical data:</span> Like most
              websites, the hosting provider may automatically log standard request data (for
              example: IP address, user agent, date/time, and requested pages) to operate and secure
              the service.
            </li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-white">Cookies and analytics</h2>
          <p className="mt-4 text-slate-300">
            I do not intentionally use analytics, tracking pixels, or advertising cookies on this
            site. If this changes, I will update this policy.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">How I use information</h2>
          <ul className="mt-4 list-disc pl-5 text-slate-300 space-y-2">
            <li>To respond to inquiries you send me.</li>
            <li>To maintain the security and reliability of the website.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-white">Sharing</h2>
          <p className="mt-4 text-slate-300">
            I do not sell your personal information. I may share information only as required to
            operate the website (for example, through the hosting provider) or if required by law.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">External links</h2>
          <p className="mt-4 text-slate-300">
            This site links to third-party websites. Their privacy practices are governed by their
            own policies.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Data retention</h2>
          <p className="mt-4 text-slate-300">
            If you contact me, I may retain the correspondence for as long as needed to respond and
            for reasonable record-keeping.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            If you have questions about this Privacy Policy, contact me via{' '}
            {linkedInUrl ? (
              <a
                className="text-slate-200 underline decoration-primary-500 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
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
              className="inline-flex items-center text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
            >
              Back to the site
            </a>
          </div>
        </Card>
      </div>
    </Section>
  );
});

Privacy.displayName = 'Privacy';

export default Privacy;
