/**
 * @fileoverview Fails if a career fact drifts between the website, the AI assistant and the résumés.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAREER_FACTS } from '../utils/careerFacts';
import { AWARDS, CERTIFICATIONS, EDUCATION, STATS } from '../constants';
import { SYSTEM_CONTEXT } from '../functions/api/chat';
import { RESUME_DOCUMENTS } from '../resume/documents';

const resumes = Object.values(RESUME_DOCUMENTS).map((doc) => ({
  src: doc.src,
  // The résumés are HTML: decode the entities they use so text can be compared.
  text: readFileSync(resolve(process.cwd(), doc.src), 'utf8').replace(/&amp;/g, '&'),
}));

const { university, platinumClubCount, goldClubCount, quotaAttainment, quotaAttainmentRecent } =
  CAREER_FACTS;

/** Every place a fact can appear: both résumés, the AI assistant and the website data. */
const allSources = (): string[] => [
  ...resumes.map((resume) => resume.text),
  SYSTEM_CONTEXT,
  JSON.stringify({ EDUCATION, CERTIFICATIONS }),
];

describe('career facts stay consistent', () => {
  describe('website (constants.tsx)', () => {
    it('names the university the same way', () => {
      const bauman = EDUCATION.filter((item) => item.institution.includes('Bauman'));
      expect(bauman).toHaveLength(2);
      for (const item of bauman) expect(item.institution).toBe(university);
    });

    it('shows the same recognition counts', () => {
      const club = AWARDS.find((award) => award.id === 'platinum-gold-club');
      expect(club?.awardLevel).toBe(`${platinumClubCount}× Platinum · ${goldClubCount}× Gold`);
      const attainment = AWARDS.find((award) => award.id === 'attainment-100');
      expect(attainment?.description).toContain(quotaAttainment);
      const stat = STATS.find((item) => item.label.includes('Platinum'));
      expect(stat?.value).toBe(platinumClubCount + goldClubCount);
    });
  });

  describe('AI assistant (functions/api/chat.ts)', () => {
    it('uses the same university and recognition', () => {
      expect(SYSTEM_CONTEXT).toContain(university);
      expect(SYSTEM_CONTEXT).toContain(`${platinumClubCount}-time Microsoft Platinum Club`);
      expect(SYSTEM_CONTEXT).toContain(`${goldClubCount}-time Gold Club`);
      expect(SYSTEM_CONTEXT).toContain(`${quotaAttainment}, ${quotaAttainmentRecent}`);
    });

    it('states the attainment count', () => {
      expect(SYSTEM_CONTEXT).not.toContain('Do not state a specific number of attainment');
    });
  });

  describe.each(resumes)('résumé $src', ({ text }) => {
    it('uses the same university', () => {
      expect(text).toContain(university);
    });

    it('uses the same recognition counts', () => {
      expect(text).toMatch(new RegExp(`Platinum Club \\(${platinumClubCount}[×x]\\)`));
      expect(text).toMatch(new RegExp(`Gold Club \\(${goldClubCount}[×x]\\)`));
      expect(text).toContain(quotaAttainment);
    });
  });

  it('never mentions "Moscow" or the Azure Solutions Architect certification anywhere', () => {
    for (const source of allSources()) {
      expect(source).not.toMatch(/Moscow/i);
      expect(source).not.toMatch(/Solutions Architect Expert/i);
    }
  });
});
