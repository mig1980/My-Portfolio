/**
 * @fileoverview Unit tests for the résumé PDF build helpers.
 */

import { describe, it, expect } from 'vitest';
import { FIT_SETTINGS, countPdfPages, normalizePdf } from '../resume/pdf';

const bytes = (text: string): Uint8Array => new Uint8Array(Buffer.from(text, 'latin1'));
const text = (pdf: Uint8Array): string => Buffer.from(pdf).toString('latin1');

describe('FIT_SETTINGS', () => {
  it('tries the largest font first and tightens spacing before shrinking text', () => {
    expect(FIT_SETTINGS).toHaveLength(15);
    expect(FIT_SETTINGS.slice(0, 4)).toEqual([
      { fontSizePt: 9.6, gap: 1 },
      { fontSizePt: 9.6, gap: 0.85 },
      { fontSizePt: 9.6, gap: 0.7 },
      { fontSizePt: 9.5, gap: 1 },
    ]);
    expect(FIT_SETTINGS.at(-1)).toEqual({ fontSizePt: 9.2, gap: 0.7 });
  });
});

describe('countPdfPages', () => {
  it('counts page objects but not the page tree', () => {
    const pdf = bytes('<</Type /Pages /Count 2>> <</Type /Page>> <</Type/Page /Parent 1 0 R>>');
    expect(countPdfPages(pdf)).toBe(2);
  });

  it('returns 0 for data without pages', () => {
    expect(countPdfPages(bytes('%PDF-1.4'))).toBe(0);
  });
});

describe('normalizePdf', () => {
  const date = new Date('2026-09-27T14:05:09Z');

  it('pins both dates and keeps the byte length', () => {
    const input = bytes(
      "/CreationDate (D:20260101010101+00'00')\n/ModDate (D:20260101010101+00'00')\xff\x00"
    );
    const output = normalizePdf(input, date);
    expect(output).toHaveLength(input.length);
    expect(text(output)).toBe(
      "/CreationDate (D:20260927140509+00'00')\n/ModDate (D:20260927140509+00'00')\xff\x00"
    );
  });

  it('gives identical output for builds made at different times', () => {
    const a = normalizePdf(bytes("/CreationDate (D:20260927201559+00'00')"), date);
    const b = normalizePdf(bytes("/CreationDate (D:20260927201610+00'00')"), date);
    expect(a).toEqual(b);
  });
});
