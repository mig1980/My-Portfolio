/**
 * @fileoverview Unit tests for useBodyScrollLock hook.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

describe('useBodyScrollLock', () => {
  let originalOverflow: string;
  let originalPaddingRight: string;

  beforeEach(() => {
    // Store original styles
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    // Restore original styles
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  });

  it('does not lock scroll when isLocked is false', () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });

  it('locks scroll when isLocked is true', () => {
    renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores original overflow on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores original overflow when isLocked changes to false', () => {
    const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
      initialProps: { isLocked: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    rerender({ isLocked: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('handles multiple lock/unlock cycles', () => {
    const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
      initialProps: { isLocked: false },
    });

    expect(document.body.style.overflow).toBe('');

    rerender({ isLocked: true });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ isLocked: false });
    expect(document.body.style.overflow).toBe('');

    rerender({ isLocked: true });
    expect(document.body.style.overflow).toBe('hidden');
  });
});
