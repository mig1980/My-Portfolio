/**
 * @fileoverview Career facts that must read the same on the website (constants.tsx), in the AI
 * assistant (functions/api/chat.ts) and in both résumés (content/*.html).
 * tests/careerFacts.test.ts fails if any of them drift apart. Keep DOM-free: the Worker imports it.
 */

export const CAREER_FACTS = {
  university: 'Bauman State Technical University',
  platinumClubCount: 2,
  goldClubCount: 3,
  /** Preceded by "Consistent" (or "consistent" mid-sentence) wherever it appears. */
  quotaAttainment: '100% quota attainment, including FY25 and FY26',
} as const;
