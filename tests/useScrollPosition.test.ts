/**
 * @fileoverview Unit tests for the useScrollPosition hook.
 * @description Tests scroll tracking, threshold behavior, and cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPosition } from '../hooks/useScrollPosition';

describe('useScrollPosition', () => {
  beforeEach(() => {
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false initially when scroll is at top', () => {
    const { result } = renderHook(() => useScrollPosition());
    expect(result.current).toBe(false);
  });

  it('returns true when scrolled past default threshold', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100 });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('respects custom threshold', () => {
    const { result } = renderHook(() => useScrollPosition({ threshold: 200 }));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 150 });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 250 });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('returns false when scrolling back up', () => {
    const { result } = renderHook(() => useScrollPosition({ threshold: 50 }));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100 });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 30 });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useScrollPosition());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
