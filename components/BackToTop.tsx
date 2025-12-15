/**
 * @fileoverview Back to top floating button component.
 * @description Displays a floating button to scroll back to top when user scrolls down.
 */

import React, { memo, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useScrollPosition } from '../hooks/useScrollPosition';

/**
 * BackToTop floating button component.
 * Features:
 * - Appears after scrolling down 400px
 * - Smooth scroll animation to top
 * - Accessible with keyboard support
 * - Respects reduced motion preferences
 *
 * @returns A floating back-to-top button
 */
const BackToTop: React.FC = memo(() => {
  const isVisible = useScrollPosition({ threshold: 400 });

  const scrollToTop = useCallback((): void => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-8 right-8 z-50 p-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg shadow-primary-900/30 transition-all transform hover:-translate-y-1 focus-ring motion-reduce:transition-none motion-reduce:hover:transform-none"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
});

BackToTop.displayName = 'BackToTop';

export default BackToTop;
