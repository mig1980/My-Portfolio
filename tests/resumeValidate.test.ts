/**
 * @fileoverview Unit tests for the résumé template validator.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateResumeHtml, MAX_RESUME_BYTES } from '../resume/validate';

const template = readFileSync(resolve(process.cwd(), 'content', 'resume.html'), 'utf8');

function withBody(snippet: string): string {
  return template.replace('</body>', `${snippet}\n</body>`);
}

function expectRejected(html: string, messagePart: string): void {
  const result = validateResumeHtml(html);
  expect(result.ok).toBe(false);
  expect(result.errors.some((e) => e.includes(messagePart))).toBe(true);
}

describe('validateResumeHtml', () => {
  it('accepts the current template', () => {
    expect(validateResumeHtml(template)).toEqual({ ok: true, errors: [] });
  });

  it('does not mistake years, ranges and amounts for phone numbers', () => {
    const html = withBody(
      '<p>2005–2006 · 2017 – 2024 · (2002-2005) · $500M · 20+ years · 150%</p>'
    );
    expect(validateResumeHtml(html).ok).toBe(true);
  });

  it('allows ordinary external links', () => {
    expect(validateResumeHtml(withBody('<a href="https://gavrilov.ai">site</a>')).ok).toBe(true);
  });

  describe('forbidden content', () => {
    it.each([
      ['<script>alert(1)</script>', '<script>'],
      ['<SCRIPT src="/x.js"></SCRIPT>', '<script>'],
      ['<iframe src="/x"></iframe>', '<iframe>'],
      ['<object data="/x"></object>', '<object>'],
      ['<embed src="/x">', '<embed>'],
      ['<link rel="stylesheet" href="/x.css">', '<link>'],
      ['<base href="/">', '<base>'],
      ['<meta http-equiv="refresh" content="0">', 'http-equiv'],
      ['<div onclick="x()">x</div>', 'event-handler'],
      ['<img src="/a.png" onerror = "x()">', 'event-handler'],
      ['<a href="javascript:alert(1)">x</a>', 'script URL'],
      ['<a href="java\nscript:alert(1)">x</a>', 'script URL'],
      ['<img src="https://example.com/a.png">', 'external resource'],
      ['<img src="//example.com/a.png">', 'external resource'],
      ['<style>@import "x.css";</style>', '@import'],
      ['<div style="background:url(https://example.com/a.png)"></div>', 'url(https://'],
      ["<style>@font-face{src:url('../secret')}</style>", 'url(../secret)'],
    ])('rejects %s', (snippet, messagePart) => {
      expectRejected(withBody(snippet), messagePart);
    });

    it.each([
      '212-555-0123',
      '(212) 555-0123',
      '212.555.0123',
      '2125550123',
      '+1 212 555 0123',
      '+44 20 7946 0958',
    ])('rejects the phone number %s', (phone) => {
      expectRejected(withBody(`<p>${phone}</p>`), 'phone number');
    });

    it('reports the line of the problem', () => {
      const html = withBody('<script></script>');
      const line = html.split('\n').findIndex((l) => l.includes('<script>')) + 1;
      expect(validateResumeHtml(html).errors).toContain(
        `Line ${line}: Remove the <script> tag. Scripts are not allowed.`
      );
    });
  });

  describe('template structure', () => {
    it('requires {{TITLE}} exactly once', () => {
      expectRejected(
        template.replace('{{TITLE}}', ''),
        '{{TITLE}} must appear exactly once (found 0)'
      );
    });

    it('rejects a duplicated {{CONTACT}}', () => {
      expectRejected(withBody('{{CONTACT}}'), '{{CONTACT}} must appear exactly once (found 2)');
    });

    it('requires --fs and --gap in :root', () => {
      expectRejected(template.replace('--gap: 1;', ''), 'Define --gap inside :root');
    });

    it('requires the CSS to use var(--fs)', () => {
      expectRejected(template.replaceAll('var(--fs)', '9.6pt'), 'Use var(--fs)');
    });

    it('requires a Letter @page with zero margin', () => {
      expectRejected(template.replace('size: Letter;', 'size: A4;'), '@page');
      expectRejected(template.replace('@page { size: Letter; margin: 0; }', ''), '@page');
    });

    it('requires a full HTML document', () => {
      expectRejected(template.replace(/^<!DOCTYPE html>/i, ''), '<!DOCTYPE html>');
      expectRejected(template.replace('</html>', ''), '</html>');
    });

    it('rejects files over the size limit', () => {
      const result = validateResumeHtml(withBody(`<p>${'a'.repeat(MAX_RESUME_BYTES)}</p>`));
      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('The limit is 100 KB');
    });
  });
});
