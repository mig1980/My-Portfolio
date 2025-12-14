/**
 * @fileoverview Terms of Use page.
 * @description Rendered inside the SPA for consistent styling.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import Card from './ui/Card';
import { SOCIAL_LINKS } from '../constants';

const EFFECTIVE_DATE = 'December 12, 2025';

const Terms: React.FC = memo(() => {
  const linkedInUrl = SOCIAL_LINKS.find((link) => link.platform === 'LinkedIn')?.url;

  return (
    <Section id="terms" className="pt-28 md:pt-36">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Terms of Use</h1>
        <p className="mt-4 text-slate-400">
          <span className="font-semibold text-slate-300">Effective date:</span> {EFFECTIVE_DATE}
        </p>

        <Card hoverEffect={false} className="mt-10">
          <p className="text-slate-300">
            By accessing and using this website, you agree to these Terms of Use. If you do not
            agree, please do not use the site.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Purpose of the site</h2>
          <p className="mt-4 text-slate-300">
            This site is a personal portfolio intended to share professional background, experience,
            and links to projects.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">No professional advice</h2>
          <p className="mt-4 text-slate-300">
            Content on this site is provided for general informational purposes only and should not
            be considered legal, financial, investment, or other professional advice.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Intellectual property</h2>
          <p className="mt-4 text-slate-300">
            Unless otherwise stated, the site content (text, layout, and original materials) is
            owned by me or used with permission. You may view and share links to this site, but you
            may not copy or republish substantial portions without permission.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">External links</h2>
          <p className="mt-4 text-slate-300">
            This site may link to third-party websites. I am not responsible for their content,
            services, or privacy practices.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Disclaimer</h2>
          <p className="mt-4 text-slate-300">
            This site is provided “as is” and “as available” without warranties of any kind, express
            or implied, to the extent permitted by law.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Limitation of liability</h2>
          <p className="mt-4 text-slate-300">
            To the extent permitted by law, I will not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising out of or related to your use of the
            site.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Changes</h2>
          <p className="mt-4 text-slate-300">
            I may update these Terms of Use from time to time. The effective date above indicates
            the latest revision.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-white">Contact</h2>
          <p className="mt-4 text-slate-300">
            For questions about these Terms, contact me via{' '}
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

Terms.displayName = 'Terms';

export default Terms;
