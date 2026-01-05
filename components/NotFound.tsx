/**
 * @fileoverview 404 Not Found page component.
 * @description Displays a friendly error page for invalid routes.
 */

import React, { memo } from 'react';
import Section from './ui/Section';
import { Home, ArrowLeft, MessageCircle } from 'lucide-react';

/**
 * 404 Not Found page component.
 * Features:
 * - Friendly error message
 * - Navigation options to return home
 * - Consistent styling with the rest of the site
 *
 * @returns The 404 error page
 */
const NotFound: React.FC = memo(() => {
  return (
    <Section id="not-found" className="min-h-screen flex items-center justify-center pt-0">
      <div className="text-center max-w-lg mx-auto px-6">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 mb-8">
          <MessageCircle className="w-10 h-10 text-primary-400" />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl md:text-9xl font-bold text-slate-800/80 mb-4 select-none">404</h1>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                       font-semibold transition-colors focus-ring"
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 
                       hover:text-white rounded-xl font-semibold transition-colors 
                       border border-slate-700 hover:border-slate-600 focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </Section>
  );
});

NotFound.displayName = 'NotFound';

export default NotFound;
