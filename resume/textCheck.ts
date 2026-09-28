/**
 * @fileoverview Checks text extracted from a built résumé PDF the way an applicant-tracking
 * system would read it. Pure (no PDF parsing here) so it can be unit-tested.
 */

export interface TextCheckInput {
  /** All text in reading order, pages joined */
  text: string;
  pages: number;
  expectedPages: number;
  /** Phrases that must all appear, in this order (case-insensitive) */
  requiredText: readonly string[];
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
  requiredText,
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

  const lower = normalized.toLowerCase();
  let from = 0;
  for (const phrase of requiredText) {
    const target = phrase.toLowerCase();
    const index = lower.indexOf(target, from);
    if (index === -1) {
      problems.push(lower.includes(target) ? `out of order: "${phrase}"` : `missing: "${phrase}"`);
      continue;
    }
    from = index + target.length;
  }
  return problems;
}
