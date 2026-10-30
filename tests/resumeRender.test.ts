/**
 * @fileoverview Unit tests for the résumé template renderer.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderResume } from '../resume/render';

const template = readFileSync(resolve(process.cwd(), 'content', 'resume.html'), 'utf8');

describe('renderResume', () => {
  it('leaves the rest of the markup untouched when no options are given', () => {
    expect(renderResume(template)).toBe(template);
  });

  it.each([
    ['executive', 'content/resume.html', 'Edited executive headline'],
    ['ATS', 'content/resume-ats.html', 'Edited ATS headline | Microsoft'],
  ])(
    'preserves an independently edited %s title while applying fit settings',
    (_label, path, title) => {
      const source = readFileSync(resolve(process.cwd(), path), 'utf8');
      const edited = source.replace(
        /<div class="title">[^<]*<\/div>/,
        `<div class="title">${title}</div>`
      );
      expect(edited).not.toBe(source);
      expect(renderResume(edited, { fontSizePt: 10, gap: 0.8 })).toContain(
        `<div class="title">${title}</div>`
      );
    }
  );

  it('keeps the contact line from the template', () => {
    const html = renderResume(template);
    const contactLine = /<div class="contact">[^<]+<\/div>/.exec(template)?.[0];
    expect(contactLine).toBeDefined();
    expect(html.match(/<div class="contact">[^<]+<\/div>/)?.[0]).toBe(contactLine);
  });

  it.each(['michael@gavrilov.ai', 'contact@gavrilov.ai'])(
    'preserves an editable contact address (%s)',
    (email) => {
      const source = `<div class="title">Editable title</div><div class="contact">${email}</div>`;
      expect(renderResume(source)).toContain(`<div class="contact">${email}</div>`);
    }
  );

  describe('fit overrides', () => {
    it('injects --fs and --gap right before </head>', () => {
      const source = '<head><style>:root { --fs: 11pt; --gap: 1; }</style></head>';
      const html = renderResume(source, { fontSizePt: 10, gap: 0.8 });
      expect(html).toBe(
        '<head><style>:root { --fs: 11pt; --gap: 1; }</style><style>:root{--fs:10pt;--gap:0.8}</style></head>'
      );
    });

    it('injects only the values provided', () => {
      const html = renderResume('<head></head>', { gap: 0.85 });
      expect(html).toBe('<head><style>:root{--gap:0.85}</style></head>');
    });

    it('prepends the override when there is no </head>', () => {
      const html = renderResume('<p>x</p>', { fontSizePt: 9.2 });
      expect(html).toBe('<style>:root{--fs:9.2pt}</style><p>x</p>');
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects fontSizePt %s', (value) => {
      expect(() => renderResume(template, { fontSizePt: value })).toThrow(RangeError);
    });

    it('rejects a non-positive gap', () => {
      expect(() => renderResume(template, { gap: 0 })).toThrow(RangeError);
    });
  });
});
