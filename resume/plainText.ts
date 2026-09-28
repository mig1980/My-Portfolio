/**
 * @fileoverview Turns the ATS résumé HTML into the plain text the AI endpoints use as their facts.
 * Pure string work with no DOM access, so it runs in Node (the generator script) and in tests.
 */

import { renderResume } from './render';

/** The contact line carries the phone number, which the AI must never hand out. */
const CONTACT_LINE = /<div\s+class="contact"[^>]*>[\s\S]*?<\/div>/gi;

const BLOCK_TAG =
  /<\/?(?:p|div|ul|ol|li|h[1-6]|br|hr|table|tr|section|header|footer|body|html)\b[^>]*>/gi;

const PHONE_NUMBER = /\+?\d{1,3}[-.\s]\d{3}[-.\s]\d{3}[-.\s]\d{4}/;

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  middot: '·',
  times: '×',
  bull: '•',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const hex = entity[1] === 'x' || entity[1] === 'X';
      const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Visible text of an HTML document: one line per block, "- " before list items. */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<head\b[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(BLOCK_TAG, '\n')
    .replace(/<[^>]*>/g, '');

  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter((line) => line.length > 0 && line !== '-')
    .join('\n');
}

/** Plain text of the ATS résumé as the AI sees it: title filled in, contact line removed. */
export function resumeTextForAi(atsHtml: string): string {
  const rendered = renderResume(atsHtml, { variant: 'enterprise' });
  return htmlToPlainText(rendered.replace(CONTACT_LINE, ''));
}

/** Reasons the extracted text can't be used; empty when it's fine. */
export function findResumeTextProblems(text: string): string[] {
  const problems: string[] = [];
  if (text.length < 1000) problems.push('The résumé text is too short.');
  if (/<[a-z/!]/i.test(text)) problems.push('The résumé text still contains HTML.');
  if (text.includes('{{')) problems.push('The résumé text still contains a {{placeholder}}.');
  if (PHONE_NUMBER.test(text)) problems.push('The résumé text contains a phone number.');
  return problems;
}
