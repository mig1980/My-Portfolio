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

  it('accepts the ATS template with print margins', () => {
    const ats = readFileSync(resolve(process.cwd(), 'content', 'resume-ats.html'), 'utf8');
    expect(validateResumeHtml(ats, { pageMargin: 'any' })).toEqual({ ok: true, errors: [] });
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
      ['<svg/onload=alert(1)>', 'event-handler'],
      ['<div class="x"onclick="y()">x</div>', 'event-handler'],
      ['<svg><image href="https://example.com/x.png"/></svg>', 'Only <a> links'],
      ['<svg><use xlink:href="//example.com/s.svg#i"/></svg>', 'Only <a> links'],
      ['<img/src="https://example.com/a.png">', 'external resource'],
      ['<a href="&#106;avascript:alert(1)">x</a>', 'script URL'],
      ['<a href="&#x6A;avascript&colon;alert(1)">x</a>', 'script URL'],
      [
        `<div style="background:image-set('https://example.com/a.png' 1x)"></div>`,
        'external URL from the CSS',
      ],
      [
        '<style>.x{background:image-set("//example.com/a.png" 1x)}</style>',
        'external URL from the CSS',
      ],
    ])('rejects %s', (snippet, messagePart) => {
      expectRejected(withBody(snippet), messagePart);
    });

    describe('decode-first external-resource checks', () => {
      it.each([
        ['CSS-escaped @import', String.raw`<style>@\69mport "x.css";</style>`, '@import'],
        [
          'escaped slashes in image-set',
          String.raw`<div style="background:image-set('https:\2f\2f example.com/a.png' 1x)"></div>`,
          'external URL from the CSS',
        ],
        [
          'a slash-less https: URL in image-set',
          `<div style="background:image-set('https:example.com/a.png' 1x)"></div>`,
          'external URL from the CSS',
        ],
        [
          'backslashes in image-set',
          String.raw`<div style="background:image-set('\\\\example.com/a.png' 1x)"></div>`,
          'external URL from the CSS',
        ],
        [
          'a CSS-escaped url()',
          String.raw`<style>.x{background:\75rl(https://example.com/a.png)}</style>`,
          'url(https://example.com/a.png)',
        ],
        [
          'an entity-encoded scheme',
          '<img src="&#104;ttps://example.com/a.png">',
          'external resource',
        ],
        [
          'named entities for ":" and "/"',
          '<img src="https&colon;&sol;&sol;example.com/a.png">',
          'external resource',
        ],
        ['https: without slashes', '<img src="https:example.com/a.png">', 'external resource'],
        ['backslash "\\\\host"', String.raw`<img src="\\example.com\a.png">`, 'external resource'],
        [
          'the second srcset candidate',
          '<img srcset="/a.png 1x, https://example.com/b.png 2x">',
          'external resource',
        ],
        [
          'a ">" inside an earlier attribute',
          '<img alt=">" src="https://example.com/a.png">',
          'external resource',
        ],
        [
          'an SVG presentation attribute',
          '<svg><rect fill="url(https://example.com/p.svg#x)"/></svg>',
          'url(https://example.com/p.svg#x)',
        ],
      ])('rejects %s', (_label, snippet, messagePart) => {
        expectRejected(withBody(snippet), messagePart);
      });

      it('allows relative paths, data: URLs, #fragments and outbound <a> links', () => {
        const html = withBody(
          '<img src="data:image/png;base64,AAAA" srcset="/a.png 1x, b.png 2x">' +
            '<svg><use href="#icon"/><rect fill="url(#g)"/></svg>' +
            '<a href="https://www.linkedin.com/in/mgavrilov">LinkedIn</a>'
        );
        expect(validateResumeHtml(html)).toEqual({ ok: true, errors: [] });
      });
    });

    it('reports a CSS url() problem only once', () => {
      const html = withBody('<div style="background:url(https://example.com/a.png)"></div>');
      expect(validateResumeHtml(html).errors).toHaveLength(1);
    });

    it('survives out-of-range character references', () => {
      expect(validateResumeHtml(withBody('<p>&#99999999; &#x110000;</p>')).ok).toBe(true);
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

    it('rejects a duplicated {{TITLE}}', () => {
      expectRejected(withBody('{{TITLE}}'), '{{TITLE}} must appear exactly once (found 2)');
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

    it('allows print margins only when asked (multi-page documents)', () => {
      const withMargins = template.replace('margin: 0; }', 'margin: 0.6in 0.7in; }');
      expectRejected(withMargins, 'margin: 0');
      expect(validateResumeHtml(withMargins, { pageMargin: 'any' }).ok).toBe(true);
      const a4 = withMargins.replace('size: Letter;', 'size: A4;');
      expect(validateResumeHtml(a4, { pageMargin: 'any' }).ok).toBe(false);
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
