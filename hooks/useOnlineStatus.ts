/**
 * @fileoverview Custom hook for detecting online/offline status.
 * @description Provides network connectivity detection with SSR safety.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to detect if the browser is online or offline.
 * Uses the Navigator.onLine API with event listeners.
 *
 * @returns True if the browser is online, false if offline
 *
 * @remarks
 * - SSR-safe: Returns true on server (optimistic default)
 * - Uses online/offline events for real-time updates
 * - Note: This only detects network availability, not actual internet access
 *
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * if (!isOnline) return <OfflineIndicator />;
 * ```
 */
export function useOnlineStatus(): boolean {
  // Default to true for SSR and initial render
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    // Set initial value in case it changed between render and effect
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
