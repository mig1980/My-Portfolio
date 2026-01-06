/**
 * @fileoverview Custom hook to lock body scroll.
 * @description Prevents background scrolling when modals/fullscreen elements are open.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useEffect } from 'react';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to lock/unlock body scrolling.
 * Useful for modals, fullscreen overlays, and mobile menus.
 *
 * @param isLocked - Whether to lock scrolling
 *
 * @remarks
 * - Preserves scroll position when locking
 * - Handles iOS Safari bounce scroll
 * - Restores original overflow on cleanup
 * - Safe for SSR (no-op on server)
 * - Uses CSS-based approach for better performance (avoids passive:false)
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * useBodyScrollLock(isOpen);
 * ```
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    // Skip on server
    if (typeof document === 'undefined') return;

    if (!isLocked) return;

    // Store original styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    // Get current scroll position BEFORE modifying styles
    const scrollY = window.scrollY;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Use position:fixed approach - more performant than touchmove preventDefault
    // This avoids the need for passive:false which blocks the compositor thread
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Add padding to compensate for scrollbar disappearing (prevents layout shift)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: restore original styles and scroll position
    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
