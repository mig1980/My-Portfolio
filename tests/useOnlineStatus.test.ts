/**
 * @fileoverview Unit tests for useOnlineStatus hook.
 * @author Michael Gavrilov
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('initial state', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(false);
    });
  });

  describe('event handling', () => {
    it('updates to false when offline event fires', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(true);

      act(() => {
        // Simulate going offline
        Object.defineProperty(window.navigator, 'onLine', {
          value: false,
          configurable: true,
        });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current).toBe(false);
    });

    it('updates to true when online event fires', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());
      expect(result.current).toBe(false);

      act(() => {
        // Simulate coming online
        Object.defineProperty(window.navigator, 'onLine', {
          value: true,
          configurable: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOnlineStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
