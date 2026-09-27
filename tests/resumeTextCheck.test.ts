/**
 * @fileoverview Unit tests for the ATS text check on extracted PDF text.
 */

import { describe, it, expect } from 'vitest';
import { findTextProblems } from '../resume/textCheck';
import { RESUME_DOCUMENTS } from '../resume/documents';

const REQUIRED = ['Michael Gavrilov', 'Executive Summary', 'Microsoft', 'Education'];
const GOOD =
  'Michael Gavrilov\nStrategic Account Director\nEXECUTIVE SUMMARY\nLeader at Microsoft.\nEDUCATION\nM.S.';

function check(text: string, pages = 1, expectedPages = 1): string[] {
  return findTextProblems({ text, pages, expectedPages, requiredText: REQUIRED });
}

describe('findTextProblems', () => {
  it('passes clean text in the right order, ignoring case and line breaks', () => {
    expect(check(GOOD)).toEqual([]);
    expect(check(GOOD.replace('EXECUTIVE SUMMARY', 'EXECUTIVE\nSUMMARY'))).toEqual([]);
  });

  it('flags the wrong page count', () => {
    expect(check(GOOD, 2, 1)).toEqual(['has 2 page(s), expected exactly 1']);
  });

  it.each([
    ['one letter split off', 'E XECUTIVE SUMMARY'],
    ['every letter split (pdf.js)', 'E X E C U T I V E S U M M A R Y'],
  ])('flags split headings: %s', (_label, heading) => {
    const problems = check(GOOD.replace('EXECUTIVE SUMMARY', heading));
    expect(problems.some((p) => p.startsWith('split words'))).toBe(true);
  });

  it('does not flag ordinary text with single-letter words', () => {
    expect(check(`${GOOD} I help teams. A plan for CRM. Q3 FY26.`)).toEqual([]);
  });

  it('flags ligature characters', () => {
    expect(check(GOOD.replace('Leader', '\uFB01nance leader'))).toContain(
      'contains ligature characters (ﬁ, ﬂ, …); disable font ligatures'
    );
  });

  it('reports missing and out-of-order phrases', () => {
    expect(check(GOOD.replace('EDUCATION', ''))).toEqual(['missing: "Education"']);
    const swapped = 'Michael Gavrilov\nEDUCATION\nEXECUTIVE SUMMARY\nMicrosoft';
    expect(check(swapped)).toEqual(['out of order: "Education"']);
  });

  it('lists required phrases for every registered document', () => {
    for (const doc of Object.values(RESUME_DOCUMENTS)) {
      expect(doc.requiredText[0]).toBe('Michael Gavrilov');
      expect(doc.requiredText.at(-1)).toBe('Education');
    }
  });
});
