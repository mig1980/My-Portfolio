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
    const contactLine = /<div class="contact">[^<]+<\/div>/.exec(template)?.[0];
    expect(contactLine).toBeDefined();
    expect(html.match(/<div class="contact">[^<]+<\/div>/)?.[0]).toBe(contactLine);
  });

  it.each(['michael@gavrilov.ai', 'contact@gavrilov.ai'])(
    'preserves an editable contact address (%s)',
    (email) => {
      const source = `<div>{{TITLE}}</div><div class="contact">${email}</div>`;
      expect(renderResume(source, { variant: 'hls' })).toContain(
        `<div class="contact">${email}</div>`
      );
    }
  );

  describe('fit overrides', () => {
    it('injects --fs and --gap right before </head>', () => {
      const source = '<head><style>:root { --fs: 11pt; --gap: 1; }</style></head>';
      const html = renderResume(source, { variant: 'enterprise', fontSizePt: 10, gap: 0.8 });
      expect(html).toBe(
        '<head><style>:root { --fs: 11pt; --gap: 1; }</style><style>:root{--fs:10pt;--gap:0.8}</style></head>'
      );
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
});
