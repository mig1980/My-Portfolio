/**
 * @fileoverview Checks text extracted from a built résumé PDF the way an applicant-tracking
 * system would read it. Pure (no PDF parsing here) so it can be unit-tested.
 */

export interface TextCheckInput {
  /** All text in reading order, pages joined */
  text: string;
  pages: number;
  expectedPages: number;
  /** Rendered source text in block order, with literal bullet markers. */
  expectedText: string;
}

/**
 * Wide letter-spacing makes extractors split words: some give "E XECUTIVE", pdf.js gives
 * "E X E C U T I V E".
 */
const SPLIT_WORD = /\b[A-Z] [A-Z]{3,}|\b(?:[A-Z] ){3,}[A-Z]\b/g;
/** ﬀ ﬁ ﬂ ﬃ ﬄ ﬅ ﬆ: some parsers drop or garble ligature glyphs. */
const LIGATURES = /[\uFB00-\uFB06]/;

export function findTextProblems({
  text,
  pages,
  expectedPages,
  expectedText,
}: TextCheckInput): string[] {
  const problems: string[] = [];
  if (pages !== expectedPages) {
    problems.push(`has ${pages} page(s), expected exactly ${expectedPages}`);
  }

  const normalized = text.replace(/\s+/g, ' ');
  const splits = normalized.match(SPLIT_WORD);
  if (splits) {
    problems.push(`split words (letter-spacing too wide?): ${[...new Set(splits)].join(', ')}`);
  }
  if (LIGATURES.test(normalized)) {
    problems.push('contains ligature characters (ﬁ, ﬂ, …); disable font ligatures');
  }
  if (/\[[^\]\r\n]+\]|\{\{[^}]+\}\}/.test(`${text}\n${expectedText}`)) {
    problems.push('contains unresolved placeholders');
  }

  const lower = normalized.toLowerCase();
  const blocks = expectedText
    .split('\n')
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (blocks.length === 0) {
    problems.push('source text is empty');
  }
  const expectedBullets = blocks.filter((block) => block.startsWith('• ')).length;
  const actualBullets = text.match(/•/g)?.length ?? 0;
  if (actualBullets !== expectedBullets) {
    problems.push(`has ${actualBullets} bullet(s), expected exactly ${expectedBullets}`);
  }
  let position = 0;
  for (const block of blocks) {
    const index = lower.indexOf(block.toLowerCase(), position);
    if (index === -1) {
      problems.push(`missing or out-of-order source text: "${block}"`);
    } else {
      position = index + block.length;
    }
  }
  return problems;
}
