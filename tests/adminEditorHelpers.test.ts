/**
 * @fileoverview Unit tests for the résumé editor helpers: fit check, line diff, debounce hook.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { estimatePages, findFit, overflowLines } from '../admin/fit';
import { lineDiff, withContext } from '../admin/lineDiff';
import { useDebouncedValue } from '../admin/useDebouncedValue';
import { LETTER_HEIGHT_PX } from '../resume/pdf';
import { RESUME_DOCUMENTS } from '../resume/documents';

const EXEC = RESUME_DOCUMENTS.executive.fit;
const ATS = RESUME_DOCUMENTS.ats.fit;

describe('findFit', () => {
  it('returns the first setting that fits, in build order', () => {
    const tried: string[] = [];
    const result = findFit(EXEC, 1, LETTER_HEIGHT_PX, (setting) => {
      tried.push(`${setting.fontSizePt}/${setting.gap}`);
      return setting.fontSizePt <= 9.4 && setting.gap <= 0.7 ? 1040 : 1100;
    });
    expect(result).toEqual({
      setting: { fontSizePt: 9.4, gap: 0.7 },
      pages: 1,
      target: 1,
      overflowLines: 0,
    });
    expect(tried.slice(0, 4)).toEqual(['9.6/1', '9.6/0.85', '9.6/0.7', '9.5/1']);
  });

  it('accepts a page that is exactly full', () => {
    expect(findFit(EXEC, 1, LETTER_HEIGHT_PX, () => LETTER_HEIGHT_PX).setting).toEqual(EXEC[0]);
  });

  it('reports roughly how many lines to cut when nothing fits', () => {
    const result = findFit(EXEC, 1, LETTER_HEIGHT_PX, () => LETTER_HEIGHT_PX + 30);
    expect(result.setting).toBeNull();
    expect(result.pages).toBe(2);
    expect(result.overflowLines).toBe(3);
  });

  it('needs exactly the target for multi-page documents', () => {
    const page = 900;
    const heights = new Map([
      [11, 2.4 * page],
      [10.75, 2.1 * page],
      [10.5, 1.9 * page],
    ]);
    const result = findFit(ATS, 2, page, (s) => heights.get(s.fontSizePt) ?? 1.5 * page);
    expect(result.setting).toEqual({ fontSizePt: 10.5, gap: 1 });
    expect(result.pages).toBe(2);
  });

  it('reports a document that is too short for its target', () => {
    const result = findFit(ATS, 2, 900, () => 800);
    expect(result).toMatchObject({ setting: null, pages: 1, target: 2, overflowLines: 0 });
  });
});

describe('estimatePages', () => {
  it('rounds partial pages up and never returns 0', () => {
    expect(estimatePages(0, 900)).toBe(1);
    expect(estimatePages(900, 900)).toBe(1);
    expect(estimatePages(901, 900)).toBe(2);
  });
});

describe('overflowLines', () => {
  it('is 0 when it fits and at least 1 when over', () => {
    expect(overflowLines(LETTER_HEIGHT_PX, LETTER_HEIGHT_PX, 9.2)).toBe(0);
    expect(overflowLines(LETTER_HEIGHT_PX + 1, LETTER_HEIGHT_PX, 9.2)).toBe(1);
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
