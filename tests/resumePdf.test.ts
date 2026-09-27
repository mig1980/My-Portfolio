/**
 * @fileoverview Unit tests for the résumé PDF build helpers.
 */

import { describe, it, expect } from 'vitest';
import { buildFitSettings, countPdfPages, normalizePdf, parsePageMarginsPx } from '../resume/pdf';
import { RESUME_DOCUMENTS, getResumeDocument, pdfUrl } from '../resume/documents';

const bytes = (text: string): Uint8Array => new Uint8Array(Buffer.from(text, 'latin1'));
const text = (pdf: Uint8Array): string => Buffer.from(pdf).toString('latin1');

describe('fit settings', () => {
  it('tries the largest font first and tightens spacing before shrinking text', () => {
    const fit = RESUME_DOCUMENTS.executive.fit;
    expect(fit).toHaveLength(15);
    expect(fit.slice(0, 4)).toEqual([
      { fontSizePt: 9.6, gap: 1 },
      { fontSizePt: 9.6, gap: 0.85 },
      { fontSizePt: 9.6, gap: 0.7 },
      { fontSizePt: 9.5, gap: 1 },
    ]);
    expect(fit.at(-1)).toEqual({ fontSizePt: 9.2, gap: 0.7 });
  });

  it('starts the ATS version large (11pt down to 10.25pt)', () => {
    const fit = RESUME_DOCUMENTS.ats.fit;
    expect(fit[0]).toEqual({ fontSizePt: 11, gap: 1 });
    expect(fit.at(-1)).toEqual({ fontSizePt: 10.25, gap: 0.7 });
  });

  it('builds font × gap combinations in order', () => {
    expect(buildFitSettings([2, 1], [1, 0.5])).toEqual([
      { fontSizePt: 2, gap: 1 },
      { fontSizePt: 2, gap: 0.5 },
      { fontSizePt: 1, gap: 1 },
      { fontSizePt: 1, gap: 0.5 },
    ]);
  });
});

describe('document registry', () => {
  it('targets 1 page for the executive and 2 for the ATS version', () => {
    expect(RESUME_DOCUMENTS.executive).toMatchObject({
      src: 'content/resume.html',
      out: 'public/CV/MGavrilovCV.pdf',
      pages: 1,
    });
    expect(RESUME_DOCUMENTS.ats).toMatchObject({
      src: 'content/resume-ats.html',
      out: 'public/CV/MGavrilovCV-ATS.pdf',
      pages: 2,
    });
  });

  it.each(['../secret', 'content/resume.html', 'toString', '__proto__', '', null])(
    'rejects the unknown id %s',
    (id) => {
      expect(getResumeDocument(id)).toBeNull();
    }
  );

  it('maps output paths to site URLs', () => {
    expect(pdfUrl(RESUME_DOCUMENTS.ats)).toBe('/CV/MGavrilovCV-ATS.pdf');
  });
});

describe('parsePageMarginsPx', () => {
  it('reads 1-4 value shorthands in common units', () => {
    expect(parsePageMarginsPx('@page { size: Letter; margin: 0; }')).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(parsePageMarginsPx('@page { margin: 0.5in 72pt; }')).toEqual({
      top: 48,
      right: 96,
      bottom: 48,
      left: 96,
    });
    const ats = parsePageMarginsPx('@page { size: Letter; margin: 0.6in 0.7in 0.55in 0.7in; }');
    expect(ats.top).toBeCloseTo(57.6);
    expect(ats.bottom).toBeCloseTo(52.8);
    expect(ats.left).toBeCloseTo(67.2);
  });

  it('treats a missing @page as zero margins', () => {
    expect(parsePageMarginsPx('<p>x</p>').top).toBe(0);
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
