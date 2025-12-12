import { useState, useEffect, useCallback } from 'react';

interface UseScrollPositionOptions {
  threshold?: number;
}

/**
 * Custom hook to track scroll position and determine if page is scrolled
 * @param options - Configuration options
 * @param options.threshold - Scroll threshold in pixels (default: 50)
 * @returns boolean indicating if page is scrolled past threshold
 */
export function useScrollPosition({ threshold = 50 }: UseScrollPositionOptions = {}): boolean {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const handleScroll = useCallback((): void => {
    setIsScrolled(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return isScrolled;
}
