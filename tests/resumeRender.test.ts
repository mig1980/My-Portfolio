/**
 * @fileoverview Unit tests for the résumé template renderer.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderResume, TITLES } from '../resume/render';

const template = readFileSync(resolve(process.cwd(), 'content', 'resume.html'), 'utf8');

describe('renderResume', () => {
  it('fills every placeholder in the real template', () => {
    const html = renderResume(template, { variant: 'enterprise' });
    expect(html).not.toContain('{{');
    expect(html).toContain('Strategic Account Director, Global Enterprise');
  });

  it('escapes the HLS title', () => {
    const html = renderResume('<div>{{TITLE}}</div>', { variant: 'hls' });
    expect(html).toBe('<div>Strategic Account Director, Healthcare &amp; Life Sciences</div>');
    expect(TITLES.hls).toContain('&');
  });

  it('leaves the rest of the markup untouched when no options are given', () => {
    const html = renderResume(template, { variant: 'enterprise' });
    expect(html).toBe(template.replace('{{TITLE}}', TITLES.enterprise));
  });

  it('keeps the contact line from the template', () => {
    const html = renderResume(template, { variant: 'hls' });
    expect(html).toContain('+1-551-208-1538');
    expect(html).toContain('contact@gavrilov.ai');
  });

  describe('fit overrides', () => {
    it('injects --fs and --gap right before </head>', () => {
      const html = renderResume(template, { variant: 'enterprise', fontSizePt: 9.4, gap: 0.7 });
      expect(html).toContain('<style>:root{--fs:9.4pt;--gap:0.7}</style></head>');
      expect(html.indexOf(':root{--fs:9.4pt')).toBeGreaterThan(html.indexOf('--fs: 9.6pt'));
    });

    it('injects only the values provided', () => {
      const html = renderResume('<head></head>', { variant: 'enterprise', gap: 0.85 });
      expect(html).toBe('<head><style>:root{--gap:0.85}</style></head>');
    });

    it('prepends the override when there is no </head>', () => {
      const html = renderResume('<p>x</p>', { variant: 'enterprise', fontSizePt: 9.2 });
      expect(html).toBe('<style>:root{--fs:9.2pt}</style><p>x</p>');
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects fontSizePt %s', (value) => {
      expect(() => renderResume(template, { variant: 'enterprise', fontSizePt: value })).toThrow(
        RangeError
      );
    });

    it('rejects a non-positive gap', () => {
      expect(() => renderResume(template, { variant: 'enterprise', gap: 0 })).toThrow(RangeError);
    });
  });

  describe('font base', () => {
    it('rewrites /fonts/ URLs to the given base', () => {
      const html = renderResume(template, { variant: 'enterprise', fontBase: 'file:///ci/fonts/' });
      expect(html).not.toContain("url('/fonts/");
      expect(html).toContain("url('file:///ci/fonts/inter-regular.woff2')");
    });

    it('handles unquoted and double-quoted URLs', () => {
      const html = renderResume('url(/fonts/a.woff2) url("/fonts/b.woff2")', {
        variant: 'enterprise',
        fontBase: '/x/',
      });
      expect(html).toBe('url(/x/a.woff2) url("/x/b.woff2")');
    });

    it('keeps URLs as-is for the default base', () => {
      const html = renderResume(template, { variant: 'enterprise', fontBase: '/fonts/' });
      expect(html).toContain("url('/fonts/inter-regular.woff2')");
    });
  });
});
