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

const {
  university,
  azureCertification,
  platinumClubCount,
  goldClubCount,
  quotaAttainment,
  quotaAttainmentRecent,
} = CAREER_FACTS;

describe('career facts stay consistent', () => {
  describe('website (constants.tsx)', () => {
    it('names the university the same way', () => {
      const bauman = EDUCATION.filter((item) => item.institution.includes('Bauman'));
      expect(bauman).toHaveLength(2);
      for (const item of bauman) expect(item.institution).toBe(university);
    });

    it('lists the Azure certification only with its end date', () => {
      const azure = CERTIFICATIONS.filter((cert) => cert.name.includes('Solutions Architect'));
      expect(azure.map((cert) => cert.name)).toEqual([
        `Microsoft Certified: ${azureCertification}`,
      ]);
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
    it('uses the same university, certification and recognition', () => {
      expect(SYSTEM_CONTEXT).toContain(university);
      expect(SYSTEM_CONTEXT).toContain(`Microsoft Certified: ${azureCertification}`);
      expect(SYSTEM_CONTEXT).toContain(`${platinumClubCount}-time Microsoft Platinum Club`);
      expect(SYSTEM_CONTEXT).toContain(`${goldClubCount}-time Gold Club`);
      expect(SYSTEM_CONTEXT).toContain(`${quotaAttainment}, ${quotaAttainmentRecent}`);
    });

    it('does not present the lapsed certification as current', () => {
      expect(SYSTEM_CONTEXT).toMatch(/no longer current/);
      expect(SYSTEM_CONTEXT).not.toContain('Do not state a specific number of attainment');
    });
  });

  describe.each(resumes)('résumé $src', ({ text }) => {
    it('uses the same university and certification', () => {
      expect(text).toContain(university);
      expect(text).toContain(azureCertification);
    });

    it('uses the same recognition counts', () => {
      expect(text).toMatch(new RegExp(`Platinum Club \\(${platinumClubCount}[×x]\\)`));
      expect(text).toMatch(new RegExp(`Gold Club \\(${goldClubCount}[×x]\\)`));
      expect(text).toContain(quotaAttainment);
    });
  });

  it('never uses the old university name or an undated Azure certification anywhere', () => {
    const sources = [
      ...resumes.map((resume) => resume.text),
      SYSTEM_CONTEXT,
      JSON.stringify({ EDUCATION, CERTIFICATIONS }),
    ];
    for (const source of sources) {
      expect(source).not.toContain('Bauman State Technical University');
      expect(source).not.toMatch(/Azure Solutions Architect Expert(?! \(through 2025\))/);
    }
  });
});
