/**
 * @fileoverview Checks a résumé against the career facts shared with the website and the AI
 * assistant. The editor shows these as warnings; tests/careerFacts.test.ts requires none.
 */

import { CAREER_FACTS } from '../utils/careerFacts';

const MATCH_ELSEWHERE = 'to match the website and the AI assistant';
const COUNT_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

/**
 * Plain-language warnings for every shared fact the résumé HTML gets wrong or leaves out.
 * Compares the facts, not the phrasing: "Platinum Club (2×)" and "Two-time Platinum Club" both pass.
 */
export function findFactWarnings(html: string): string[] {
  const text = html.replace(/&amp;/g, '&');
  const { university, platinumClubCount, goldClubCount, quotaAttainmentYears } = CAREER_FACTS;
  const warnings: string[] = [];

  if (!text.includes(university)) {
    warnings.push(`The university should read "${university}" ${MATCH_ELSEWHERE}.`);
  }
  for (const [club, count] of [
    ['Platinum', platinumClubCount],
    ['Gold', goldClubCount],
  ] as const) {
    const times = `(?:${count}|${COUNT_WORDS[count] ?? count})-time`;
    if (!new RegExp(`${club} Club \\(${count}[×x]\\)|\\b${times} ${club} Club`, 'i').test(text)) {
      warnings.push(`${club} Club should show ${count}× ${MATCH_ELSEWHERE}.`);
    }
  }
  if (!/100%\+? quota attainment/i.test(text)) {
    warnings.push(`Mention 100% quota attainment ${MATCH_ELSEWHERE}.`);
  }
  for (const match of text.matchAll(/quota attainment in (\d+) fiscal years/gi)) {
    if (Number(match[1]) !== quotaAttainmentYears) {
      warnings.push(
        `Quota attainment should say ${quotaAttainmentYears} fiscal years ${MATCH_ELSEWHERE}.`
      );
    }
  }
  return warnings;
}
