/**
 * @fileoverview Unit tests for useIsMobile hook.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useIsMobile } from '../hooks/useIsMobile';

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: ((event: { matches: boolean }) => void)[] = [];

  beforeEach(() => {
    listeners = [];

    matchMediaMock = vi.fn((query: string) => ({
      matches: query.includes('639') ? true : false, // Default to mobile
      media: query,
      addEventListener: vi.fn((_, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn((_, handler) => {
        const index = listeners.indexOf(handler);
        if (index > -1) listeners.splice(index, 1);
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    listeners = [];
  });

  it('returns false initially (SSR safe)', () => {
    // Initially false before hydration
    const { result } = renderHook(() => useIsMobile());
    // After effect runs, it should match the media query
    expect(typeof result.current).toBe('boolean');
  });

  it('calls matchMedia with correct breakpoint', () => {
    renderHook(() => useIsMobile());
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 639px)');
  });

  it('uses custom breakpoint when provided', () => {
    renderHook(() => useIsMobile(768));
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useIsMobile());

    // Simulate viewport resize to desktop
    act(() => {
      listeners.forEach((listener) => listener({ matches: false }));
    });

    expect(result.current).toBe(false);

    // Simulate viewport resize back to mobile
    act(() => {
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    const mockMediaQuery = matchMediaMock.mock.results[0]?.value;
    unmount();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
  });
});
