/**
 * @fileoverview Contact section and page footer component.
 * @description Provides contact information, social links, and copyright notice.
 */

import React from 'react';
import { SOCIAL_LINKS, PERSONAL_INFO } from '../constants';
import { Coffee } from 'lucide-react';

/**
 * Contact section and footer component.
 * Features:
 * - Social media link buttons with hover animations
 * - Copyright and legal links footer
 *
 * @returns The contact section with footer
 */
const Contact: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white mb-6">Let's Connect</h2>
          <p className="text-slate-300 max-w-md text-lg mb-8">
            Always open to a good conversation—about AI, deals, or ideas worth exploring.
          </p>
          <div className="flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="p-4 bg-slate-900 rounded-full text-slate-300 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
            <a
              href={PERSONAL_INFO.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-semibold transition-all transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label="Book a 15 minute call"
            >
              <Coffee className="w-5 h-5" />
              Book 15 minutes
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 text-slate-600 text-sm">
          <p>© {new Date().getFullYear()} Michael Gavrilov. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="/privacy"
              className="text-slate-600 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-slate-600 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Contact;
