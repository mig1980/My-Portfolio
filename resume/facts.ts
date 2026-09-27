/**
 * @fileoverview Checks a résumé against the career facts shared with the website and the AI
 * assistant. The editor shows these as warnings; tests/careerFacts.test.ts requires none.
 */

import { CAREER_FACTS } from '../utils/careerFacts';

const MATCH_ELSEWHERE = 'to match the website and the AI assistant';

/** Plain-language warnings for every shared fact the résumé HTML gets wrong or leaves out. */
export function findFactWarnings(html: string): string[] {
  const text = html.replace(/&amp;/g, '&');
  const { university, platinumClubCount, goldClubCount, quotaAttainment } = CAREER_FACTS;
  const warnings: string[] = [];

  if (!text.includes(university)) {
    warnings.push(`The university should read "${university}" ${MATCH_ELSEWHERE}.`);
  }
  for (const [club, count] of [
    ['Platinum', platinumClubCount],
    ['Gold', goldClubCount],
  ] as const) {
    if (!new RegExp(`${club} Club \\(${count}[×x]\\)`).test(text)) {
      warnings.push(`${club} Club should show ${count}× ${MATCH_ELSEWHERE}.`);
    }
  }
  if (!text.includes(quotaAttainment)) {
    warnings.push(`Quota attainment should read "${quotaAttainment}" ${MATCH_ELSEWHERE}.`);
  }
  return warnings;
}
