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

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply scroll lock
    document.body.style.overflow = 'hidden';

    // Add padding to compensate for scrollbar disappearing (prevents layout shift)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // iOS Safari fix: prevent touchmove on body
    const preventTouchMove = (e: TouchEvent): void => {
      // Allow scrolling within the chat container
      const target = e.target as HTMLElement;
      if (target.closest('[data-scroll-container]')) {
        return;
      }
      e.preventDefault();
    };

    document.body.addEventListener('touchmove', preventTouchMove, { passive: false });

    // Cleanup: restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.removeEventListener('touchmove', preventTouchMove);
    };
  }, [isLocked]);
}
