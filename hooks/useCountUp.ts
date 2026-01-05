import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountUpOptions {
  /** Target value to count up to */
  end: number;
  /** Duration of animation in milliseconds */
  duration?: number;
  /** Whether to start the animation */
  start?: boolean;
}

interface UseCountUpReturn {
  /** Current animated value */
  count: number;
  /** Ref to attach to the element for intersection observation */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Whether the element is in view */
  inView: boolean;
}

/**
 * Custom hook for animated counting with intersection observer.
 * Animates from 0 to the target value when element enters viewport.
 *
 * @param options - Configuration options
 * @param options.end - Target value to count up to
 * @param options.duration - Animation duration in ms (default: 2000)
 * @param options.start - Whether to start immediately (default: false, uses intersection)
 * @returns Object with current count, ref, and inView status
 *
 * @example
 * ```tsx
 * const { count, ref, inView } = useCountUp({ end: 250, duration: 2000 });
 * return <div ref={ref}>{count}</div>;
 * ```
 */
export function useCountUp({
  end,
  duration = 2000,
  start = false,
}: UseCountUpOptions): UseCountUpReturn {
  const [count, setCount] = useState<number>(0);
  const [inView, setInView] = useState<boolean>(false);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Intersection Observer to detect when element is in viewport
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setInView(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  // Animation effect
  const animate = useCallback(() => {
    const startTime = performance.now();
    const startValue = 0;

    const updateCount = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo for smooth deceleration
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutExpo);

      setCount(currentValue);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
        setHasAnimated(true);
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(updateCount);
  }, [end, duration]);

  // Cleanup RAF on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Trigger animation when in view or when start prop is true
  useEffect(() => {
    if ((inView || start) && !hasAnimated) {
      animate();
    }
  }, [inView, start, hasAnimated, animate]);

  return { count, ref, inView };
}
