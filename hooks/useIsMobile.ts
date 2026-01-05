/**
 * @fileoverview Custom hook for detecting mobile viewport.
 * @description Provides responsive breakpoint detection with SSR safety.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

// ============================================================================
// Constants
// ============================================================================

/** Mobile breakpoint in pixels (Tailwind's 'sm' breakpoint) */
const MOBILE_BREAKPOINT = 640;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to detect if the viewport is mobile-sized.
 * Uses matchMedia for efficient resize detection.
 *
 * @param breakpoint - Width threshold in pixels (default: 640)
 * @returns True if viewport width is below breakpoint
 *
 * @remarks
 * - SSR-safe: Returns false on server, then hydrates on client
 * - Uses matchMedia for performance (no resize event spam)
 * - Handles orientation changes automatically
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  // Initialize with actual value if available (avoids flash on mobile)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    // Create media query
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setIsMobile(event.matches);
    };

    // Modern browsers use addEventListener
    // Safari < 14 uses addListener (deprecated but needed for compatibility)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
}
