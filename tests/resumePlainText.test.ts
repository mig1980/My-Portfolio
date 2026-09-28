/**
 * @fileoverview Tests for the résumé plain-text extraction that grounds the AI endpoints.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findResumeTextProblems, htmlToPlainText, resumeTextForAi } from '../resume/plainText';
import { RESUME_DOCUMENTS } from '../resume/documents';
import { TITLES } from '../resume/render';
import { CAREER_FACTS } from '../utils/careerFacts';

const atsHtml = readFileSync(resolve(process.cwd(), RESUME_DOCUMENTS.ats.src), 'utf8');

describe('htmlToPlainText', () => {
  it('drops the head, styles, scripts and comments', () => {
    const html =
      '<html><head><title>Hidden</title><style>p{color:red}</style></head>' +
      '<body><!-- note --><script>alert(1)</script><p>Visible</p></body></html>';
    expect(htmlToPlainText(html)).toBe('Visible');
  });

  it('puts blocks and list items on their own lines', () => {
    const html = '<h2>SKILLS</h2><div><b>AI:</b> agents</div><ul><li>One</li><li>Two</li></ul>';
    expect(htmlToPlainText(html)).toBe('SKILLS\nAI: agents\n- One\n- Two');
  });

  it('decodes named and numeric entities', () => {
    expect(htmlToPlainText('<p>R&amp;D &#8211; Michael&#39;s &nbsp;team&hellip;</p>')).toBe(
      "R&D – Michael's team…"
    );
  });
});

describe('resumeTextForAi (content/resume-ats.html)', () => {
  const text = resumeTextForAi(atsHtml);

  it('is usable: long enough, no HTML, no placeholders, no phone number', () => {
    expect(findResumeTextProblems(text)).toEqual([]);
  });

  it('fills in the title and keeps the key facts', () => {
    expect(text).toContain(TITLES.enterprise);
    expect(text).toContain(CAREER_FACTS.university);
    expect(text).toContain('top-five global pharmaceutical company');
    expect(text).toContain('- Grew the account 5x since 2017');
  });

  it('leaves out the contact line', () => {
    expect(text).not.toContain('contact@gavrilov.ai');
    expect(text).not.toContain('+1-');
  });
});

describe('findResumeTextProblems', () => {
  it('reports each problem', () => {
    expect(findResumeTextProblems('<b>{{TITLE}}</b> +1-555-123-4567')).toEqual([
      'The résumé text is too short.',
      'The résumé text still contains HTML.',
      'The résumé text still contains a {{placeholder}}.',
      'The résumé text contains a phone number.',
    ]);
  });
});
