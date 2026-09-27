/**
 * @fileoverview Unit tests for the résumé editor helpers: fit check, line diff, debounce hook.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { findFit, overflowLines } from '../admin/fit';
import { lineDiff, withContext } from '../admin/lineDiff';
import { useDebouncedValue } from '../admin/useDebouncedValue';
import { FIT_SETTINGS, LETTER_HEIGHT_PX } from '../resume/pdf';

describe('findFit', () => {
  it('returns the first setting that fits, in build order', () => {
    const tried: string[] = [];
    const result = findFit((setting) => {
      tried.push(`${setting.fontSizePt}/${setting.gap}`);
      return setting.fontSizePt <= 9.4 && setting.gap <= 0.7 ? 1040 : 1100;
    });
    expect(result).toEqual({
      setting: { fontSizePt: 9.4, gap: 0.7 },
      heightPx: 1040,
      overflowLines: 0,
    });
    expect(tried.slice(0, 4)).toEqual(['9.6/1', '9.6/0.85', '9.6/0.7', '9.5/1']);
  });

  it('accepts a page that is exactly full', () => {
    expect(findFit(() => LETTER_HEIGHT_PX).setting).toEqual(FIT_SETTINGS[0]);
  });

  it('reports roughly how many lines to cut when nothing fits', () => {
    const result = findFit(() => LETTER_HEIGHT_PX + 30);
    expect(result.setting).toBeNull();
    expect(result.heightPx).toBe(LETTER_HEIGHT_PX + 30);
    expect(result.overflowLines).toBe(3);
  });
});

describe('overflowLines', () => {
  it('is 0 when it fits and at least 1 when over', () => {
    expect(overflowLines(LETTER_HEIGHT_PX, 9.2)).toBe(0);
    expect(overflowLines(LETTER_HEIGHT_PX + 1, 9.2)).toBe(1);
  });
});

describe('lineDiff', () => {
  it('marks added, removed and unchanged lines', () => {
    expect(lineDiff('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' },
    ]);
  });

  it('returns only unchanged lines for identical input', () => {
    expect(lineDiff('x\ny', 'x\ny').every((entry) => entry.kind === 'same')).toBe(true);
  });

  it('collapses unchanged lines far from any change', () => {
    const before = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
    const after = before.replace('line 10', 'changed');
    const rows = withContext(lineDiff(before, after), 1);
    expect(rows).toEqual([
      { kind: 'gap', count: 9 },
      { kind: 'same', text: 'line 9' },
      { kind: 'removed', text: 'line 10' },
      { kind: 'added', text: 'changed' },
      { kind: 'same', text: 'line 11' },
      { kind: 'gap', count: 8 },
    ]);
  });
});

describe('useDebouncedValue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('only updates after the value stops changing', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });
});
