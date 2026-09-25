/**
 * @fileoverview 404 Not Found page component.
 * @description Displays a friendly error page for invalid routes.
 */

import React, { memo, useCallback } from 'react';
import Section from './ui/Section';
import { Home, ArrowLeft } from 'lucide-react';

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
  const handleGoBack = useCallback((): void => {
    window.history.back();
  }, []);

  return (
    <Section id="not-found" className="min-h-screen flex items-center justify-center pt-0">
      <div className="text-center max-w-lg mx-auto px-6">
        {/* Error Code */}
        <p
          className="font-display text-9xl md:text-[10rem] leading-none text-stone-400 mb-6 select-none"
          aria-hidden="true"
        >
          404
        </p>

        {/* Message */}
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Page not found</h1>
        <p className="text-stone-700 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-stone-800 text-paper rounded-full font-semibold transition-colors focus-ring"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go home
          </a>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-stone-400 hover:border-ink text-ink rounded-full font-semibold transition-colors focus-ring"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>
    </Section>
  );
});

NotFound.displayName = 'NotFound';

export default NotFound;
