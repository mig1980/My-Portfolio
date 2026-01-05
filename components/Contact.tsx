/**
 * @fileoverview Contact section and page footer component.
 * @description Provides contact information, social links, and copyright notice.
 */

import React, { memo } from 'react';
import { SOCIAL_LINKS } from '../constants';

/**
 * Contact section and footer component.
 * Features:
 * - Social media link buttons with hover animations
 * - Copyright and legal links footer
 *
 * @returns The contact section with footer
 */
const Contact: React.FC = memo(() => {
  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white mb-6">Let's Connect</h2>
          <p className="text-slate-300 max-w-md text-lg mb-8">
            Got an idea worth exploring? I'm always up for a good conversation about AI, enterprise
            strategy, or the future of work.
          </p>
          <div className="flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="p-4 bg-slate-900 rounded-full text-slate-300 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 focus-ring"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 text-slate-600 text-sm">
          <p>© {new Date().getFullYear()} Michael Gavrilov. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="https://logo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-300 transition-colors focus-ring-inset rounded-sm"
            >
              Logos by Logo.dev
            </a>
            <a
              href="/legal"
              className="text-slate-600 hover:text-slate-300 transition-colors focus-ring-inset rounded-sm"
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
