/**
 * @fileoverview Custom hook for intersection observer-based animations.
 * @description Detects when elements enter the viewport for scroll animations.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect when an element enters the viewport.
 * Uses IntersectionObserver for performance.
 *
 * @param options - IntersectionObserver options
 * @returns Ref to attach to element and boolean indicating if visible
 *
 * @example
 * ```tsx
 * const [ref, isVisible] = useInView({ threshold: 0.1 });
 * return <div ref={ref} className={isVisible ? 'animate-in' : 'opacity-0'}>
 * ```
 */
export function useInView(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Once visible, stay visible (no exit animation)
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isVisible];
}
