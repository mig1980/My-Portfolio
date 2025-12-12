/**
 * @fileoverview Contact section and page footer component.
 * @description Provides contact information, social links, and copyright notice.
 */

import React from 'react';
import { SOCIAL_LINKS, PERSONAL_INFO } from '../constants';
import { Mail, ArrowUpRight } from 'lucide-react';

/**
 * Contact section and footer component.
 * Features:
 * - Social media link buttons with hover animations
 * - Direct email contact card
 * - External profile link
 * - Copyright and legal links footer
 *
 * @returns The contact section with footer
 */
const Contact: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">Let's Connect</h2>
            <p className="text-slate-400 max-w-md text-lg mb-8">
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
                  className="p-3 bg-slate-900 rounded-full text-slate-400 hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-900/30 rounded-full text-primary-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Email Direct</p>
                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className="text-xl font-bold text-white hover:text-primary-400 transition-colors"
                >
                  {PERSONAL_INFO.email}
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-500 mb-4">Or visit my Microsoft profile:</p>
              <a
                href="https://www.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-slate-300 hover:text-white group"
              >
                Microsoft.com
                <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 text-slate-600 text-sm">
          <p>© {new Date().getFullYear()} Michael Gavrilov. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="text-slate-600">Privacy Policy</span>
            <span className="text-slate-600">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Contact;
