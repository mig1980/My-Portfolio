/**
 * @fileoverview Contact section and page footer component.
 * @description Provides contact information, social links, and copyright notice.
 */

import React from 'react';
import { SOCIAL_LINKS } from '../constants';

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
            Whether you want to discuss AI strategy, complex deal structures, or the future of
            investing, I'm always open to connecting.
          </p>
          <div className="flex gap-4">
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
