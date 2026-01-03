/**
 * @fileoverview Custom hook for swipe-to-dismiss gesture detection.
 * @description Provides touch gesture handling for dismissing UI elements on mobile.
 * Supports configurable direction, threshold, and respects reduced motion preferences.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useRef, useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/** Swipe direction options */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/** Configuration options for useSwipeToDismiss */
export interface UseSwipeToDismissOptions {
  /** Swipe direction to trigger dismiss (default: 'down') */
  direction?: SwipeDirection;
  /** Minimum distance in pixels to trigger dismiss (default: 100) */
  threshold?: number;
  /** Minimum velocity in px/ms to trigger dismiss (default: 0.3) */
  velocityThreshold?: number;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
  /** Callback when dismiss is triggered */
  onDismiss: () => void;
  /** Optional callback during swipe with progress (0-1) */
  onSwipeProgress?: (progress: number) => void;
  /** Optional callback when swipe starts */
  onSwipeStart?: () => void;
  /** Optional callback when swipe ends without dismiss */
  onSwipeCancel?: () => void;
}

/** Return type for useSwipeToDismiss */
export interface UseSwipeToDismissReturn {
  /** Ref to attach to the swipeable element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Current swipe offset for visual feedback */
  offset: number;
  /** Whether a swipe is in progress */
  isSwiping: boolean;
  /** Handler props to spread on the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Default swipe threshold in pixels */
const DEFAULT_THRESHOLD = 100;

/** Default velocity threshold in px/ms */
const DEFAULT_VELOCITY_THRESHOLD = 0.3;

/** Maximum offset for visual feedback (prevents over-pull) */
const MAX_OFFSET = 200;

/** Resistance factor for over-pull (0-1, lower = more resistance) */
const RESISTANCE_FACTOR = 0.4;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if user prefers reduced motion.
 * @returns True if reduced motion is preferred
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Applies resistance to offset value (rubber-band effect).
 * @param offset - Raw offset value
 * @param max - Maximum offset before full resistance
 * @returns Offset with resistance applied
 */
function applyResistance(offset: number, max: number): number {
  if (Math.abs(offset) <= max) return offset;

  const sign = offset > 0 ? 1 : -1;
  const excess = Math.abs(offset) - max;
  const resistedExcess = excess * RESISTANCE_FACTOR;

  return sign * (max + resistedExcess);
}

/**
 * Gets the primary axis offset based on direction.
 * @param direction - Swipe direction
 * @param deltaX - Horizontal delta
 * @param deltaY - Vertical delta
 * @returns Offset value (positive in swipe direction)
 */
function getDirectionalOffset(direction: SwipeDirection, deltaX: number, deltaY: number): number {
  switch (direction) {
    case 'down':
      return deltaY;
    case 'up':
      return -deltaY;
    case 'right':
      return deltaX;
    case 'left':
      return -deltaX;
  }
}

/**
 * Checks if the touch is on a scrollable element that should block swipe.
 * @param target - Touch target element
 * @param direction - Swipe direction
 * @returns True if swipe should be blocked
 */
function shouldBlockSwipe(target: EventTarget | null, direction: SwipeDirection): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  let element: HTMLElement | null = target;

  while (element) {
    // Check for scrollable containers
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    // Check if element has data attribute to block swipe
    if (element.dataset.blockSwipe === 'true') return true;

    // For vertical swipes, check if element is scrollable vertically
    if (direction === 'down' || direction === 'up') {
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const canScrollUp = element.scrollTop > 0;
        const canScrollDown = element.scrollTop < element.scrollHeight - element.clientHeight;

        // Block if scrolling in the same direction as swipe
        if (direction === 'down' && canScrollUp) return true;
        if (direction === 'up' && canScrollDown) return true;
      }
    }

    // For horizontal swipes, check if element is scrollable horizontally
    if (direction === 'left' || direction === 'right') {
      if (overflowX === 'auto' || overflowX === 'scroll') {
        const canScrollLeft = element.scrollLeft > 0;
        const canScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth;

        if (direction === 'right' && canScrollLeft) return true;
        if (direction === 'left' && canScrollRight) return true;
      }
    }

    element = element.parentElement;
  }

  return false;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for swipe-to-dismiss gesture detection.
 * Provides touch handlers and visual feedback state.
 *
 * @param options - Configuration options
 * @returns Ref, offset state, and event handlers
 *
 * @remarks
 * - Only triggers on clean directional swipes (not diagonal)
 * - Respects scrollable containers (won't dismiss while scrolling)
 * - Provides visual feedback during swipe
 * - Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * const { ref, offset, handlers } = useSwipeToDismiss({
 *   direction: 'down',
 *   onDismiss: () => setIsOpen(false),
 * });
 *
 * return (
 *   <div
 *     ref={ref}
 *     {...handlers}
 *     style={{ transform: `translateY(${offset}px)` }}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function useSwipeToDismiss({
  direction = 'down',
  threshold = DEFAULT_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  enabled = true,
  onDismiss,
  onSwipeProgress,
  onSwipeStart,
  onSwipeCancel,
}: UseSwipeToDismissOptions): UseSwipeToDismissReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  // Touch tracking refs (avoid re-renders during gesture)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  const wasBlockedRef = useRef<boolean>(false);

  // Reset state when disabled
  useEffect(() => {
    if (!enabled) {
      setOffset(0);
      setIsSwiping(false);
      touchStartRef.current = null;
      isTrackingRef.current = false;
    }
  }, [enabled]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent): void => {
      if (!enabled) return;

      const touch = e.touches[0];
      if (!touch) return;

      // Check if we should block swipe (scrollable content)
      if (shouldBlockSwipe(e.target, direction)) {
        wasBlockedRef.current = true;
        return;
      }

      wasBlockedRef.current = false;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [enabled, direction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent): void => {
      if (!enabled || !touchStartRef.current || wasBlockedRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const rawOffset = getDirectionalOffset(direction, deltaX, deltaY);

      // Only track if moving in the correct direction
      // Check angle to ensure it's not a diagonal swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const isVerticalSwipe = direction === 'up' || direction === 'down';
      const isCorrectDirection = isVerticalSwipe ? absY > absX : absX > absY;

      // Only positive offset (in swipe direction) triggers the gesture
      if (rawOffset > 0 && isCorrectDirection) {
        if (!isTrackingRef.current) {
          isTrackingRef.current = true;
          setIsSwiping(true);
          onSwipeStart?.();
        }

        // Apply resistance for visual feedback
        const resistedOffset = applyResistance(rawOffset, MAX_OFFSET);

        // Skip visual feedback if reduced motion preferred
        if (!prefersReducedMotion()) {
          setOffset(resistedOffset);
        }

        // Calculate and report progress
        const progress = Math.min(rawOffset / threshold, 1);
        onSwipeProgress?.(progress);

        // Prevent scrolling while swiping
        e.preventDefault();
      }
    },
    [enabled, direction, threshold, onSwipeStart, onSwipeProgress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent): void => {
      if (!enabled || !touchStartRef.current || wasBlockedRef.current) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        setOffset(0);
        setIsSwiping(false);
        isTrackingRef.current = false;
        return;
      }

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      const rawOffset = getDirectionalOffset(direction, deltaX, deltaY);

      // Calculate velocity (px/ms)
      const velocity = duration > 0 ? rawOffset / duration : 0;

      // Dismiss if threshold met OR velocity is high enough
      const shouldDismiss =
        rawOffset > 0 && (rawOffset >= threshold || velocity >= velocityThreshold);

      if (shouldDismiss && isTrackingRef.current) {
        onDismiss();
      } else if (isTrackingRef.current) {
        onSwipeCancel?.();
      }

      // Reset state
      touchStartRef.current = null;
      setOffset(0);
      setIsSwiping(false);
      isTrackingRef.current = false;
    },
    [enabled, direction, threshold, velocityThreshold, onDismiss, onSwipeCancel]
  );

  // Memoize handlers object
  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    ref,
    offset,
    isSwiping,
    handlers,
  };
}
