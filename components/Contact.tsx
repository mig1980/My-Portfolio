/**
 * @fileoverview Contact section and page footer component.
 * @description Provides contact information, social links, and copyright notice.
 */

import React, { memo, useCallback } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import SectionHeading from './ui/SectionHeading';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../constants';
import { trackEvent } from '../utils/analytics';

/** Row style shared by every contact option */
const ROW_CLASS =
  'group flex items-center justify-between gap-6 py-5 border-t border-stone-700 text-paper hover:text-primary-300 transition-colors focus-ring-inset focus-visible:ring-primary-300 rounded-sm';

/**
 * Turns a contact URL into the short text shown to visitors.
 * @param url - mailto: or https: link
 * @returns Display text, e.g. "contact@gavrilov.ai" or "linkedin.com/in/mgavrilov"
 */
function toDisplayText(url: string): string {
  return url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '');
}

/**
 * Contact section and footer component.
 * Features:
 * - Labeled contact options (email, LinkedIn, résumé) with click tracking
 * - Copyright and legal links footer
 *
 * @returns The contact section with footer
 */
const Contact: React.FC = memo(() => {
  const handleContactClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>): void => {
    trackEvent('contact_click', { platform: e.currentTarget.dataset.platform ?? 'unknown' });
  }, []);

  const handleResumeClick = useCallback((): void => {
    trackEvent('resume_download', { location: 'contact' });
  }, []);

  return (
    <footer id="contact" className="bg-ink text-paper pt-24 pb-28 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-6 min-w-0">
            <SectionHeading
              number="07"
              label="Contact"
              title="Let's build something worth talking about."
              intro="Always up for a good conversation about AI, technology, or the future of work."
              onDark
            />
          </div>

          <div className="md:col-span-6 md:pt-10 min-w-0">
            {SOCIAL_LINKS.map((link) => {
              const isEmail = link.url.startsWith('mailto:');
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target={isEmail ? undefined : '_blank'}
                  rel={isEmail ? undefined : 'noopener noreferrer'}
                  data-platform={link.platform}
                  onClick={handleContactClick}
                  className={ROW_CLASS}
                >
                  <span className="flex items-center gap-4 min-w-0">
                    <span className="text-stone-400 group-hover:text-primary-300 transition-colors">
                      {link.icon}
                    </span>
                    <span>
                      <span className="block font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
                        {link.platform}
                      </span>
                      <span className="block text-lg md:text-xl [overflow-wrap:anywhere]">
                        {toDisplayText(link.url)}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                </a>
              );
            })}
            <a
              href={PERSONAL_INFO.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleResumeClick}
              className={`${ROW_CLASS} border-b`}
            >
              <span className="flex items-center gap-4">
                <span className="text-stone-400 group-hover:text-primary-300 transition-colors">
                  <Download className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
                    Résumé
                  </span>
                  <span className="block text-lg md:text-xl">Download PDF</span>
                </span>
              </span>
              <ArrowUpRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-stone-800 text-stone-400 text-sm">
          <p>© {new Date().getFullYear()} Michael Gavrilov. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="https://logo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-paper transition-colors focus-ring-inset focus-visible:ring-primary-300 rounded-sm"
            >
              Logos by Logo.dev
            </a>
            <a
              href="/legal"
              className="text-stone-400 hover:text-paper transition-colors focus-ring-inset focus-visible:ring-primary-300 rounded-sm"
            >
              Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

Contact.displayName = 'Contact';

export default Contact;
