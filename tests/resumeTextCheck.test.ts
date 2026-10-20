/**
 * @fileoverview Unit tests for the ATS text check on extracted PDF text.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  describe.each(Object.values(RESUME_DOCUMENTS))('$id source structure', (doc) => {
    const html = readFileSync(resolve(process.cwd(), doc.src), 'utf8');
    const source = new DOMParser().parseFromString(html, 'text/html');

    it('uses one text heading and six semantic role headings in a single column', () => {
      expect(source.querySelectorAll('h1')).toHaveLength(1);
      const roles = source.querySelectorAll('.role');
      expect(roles).toHaveLength(6);
      for (const role of roles) {
        expect(role.querySelector('h3')?.textContent).toMatch(
          /\| .+ \| [A-Z][a-z]{2} \d{4} – (?:Present|[A-Z][a-z]{2} \d{4})$/
        );
        expect(role.querySelectorAll('ul > li').length).toBeGreaterThan(0);
      }
      expect(source.querySelector('table, img, svg')).toBeNull();
    });

    it('puts exactly one literal bullet at the beginning of every list item', () => {
      const items = [...source.querySelectorAll('li')];
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.textContent?.trim()).toMatch(/^• [^•]+$/);
      }
      expect(html).not.toMatch(/::before|list-style-image/);
    });

    it('preserves font and layout safeguards without clipping text to force a fit', () => {
      expect(html).toContain('font-variant-ligatures: none');
      expect(html).toMatch(/\.role\s*\{[^}]*break-inside:\s*avoid/);
      expect(html).not.toMatch(/overflow:\s*hidden|line-clamp|position:\s*absolute|float:/);
    });
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
      expect(doc.requiredText).toContain('michael@gavrilov.ai');
      expect(doc.requiredText).toContain('Education');
      expect(doc.requiredText).toContain('Certifications & Executive Education');
    }
  });

  describe('full source integrity', () => {
    const expectedText = `${GOOD}\n• Grew the account\n• Led a team`;
    const validate = (text: string): string[] =>
      findTextProblems({ text, pages: 1, expectedPages: 1, requiredText: REQUIRED, expectedText });

    it('accepts all source blocks and bullets with PDF line wrapping', () => {
      expect(validate(expectedText.replace('Grew the account', 'Grew the\naccount'))).toEqual([]);
      expect(validate(expectedText.replace('Michael Gavrilov', 'MICHAEL GAVRILOV'))).toEqual([]);
    });

    it('rejects missing and duplicated bullet markers', () => {
      expect(validate(expectedText.replace('• Grew', 'Grew'))).toContain(
        'has 1 bullet(s), expected exactly 2'
      );
      expect(validate(expectedText.replace('• Grew', '• • Grew'))).toContain(
        'has 3 bullet(s), expected exactly 2'
      );
    });

    it('rejects lost text even if the section headings and bullet count survive', () => {
      expect(validate(expectedText.replace('Grew the account', 'Grew'))).toContain(
        'missing or out-of-order source text: "• Grew the account"'
      );
    });

    it('rejects reordered bullets', () => {
      expect(validate(`${GOOD}\n• Led a team\n• Grew the account`)).toContain(
        'missing or out-of-order source text: "• Led a team"'
      );
    });

    it.each(['[result]', '[MM]', '[$X / X%]', '{{TITLE}}'])(
      'rejects unresolved placeholders (%s)',
      (placeholder) => {
        expect(validate(`${expectedText}\n${placeholder}`)).toContain(
          'contains unresolved placeholders'
        );
      }
    );

    it('also detects placeholders missing from the PDF but present in the source', () => {
      expect(
        findTextProblems({
          text: GOOD,
          pages: 1,
          expectedPages: 1,
          requiredText: REQUIRED,
          expectedText: `${GOOD}\n[result]`,
        })
      ).toContain('contains unresolved placeholders');
    });
  });
});
