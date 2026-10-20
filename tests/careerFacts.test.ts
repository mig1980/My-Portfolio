/**
 * @fileoverview Fails if a career fact drifts between the website, the AI assistant and the résumés.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAREER_FACTS } from '../utils/careerFacts';
import { AWARDS, EDUCATION, SOCIAL_LINKS, STATS } from '../constants';
import { SYSTEM_CONTEXT } from '../functions/api/chat';
import { RESUME_DOCUMENTS } from '../resume/documents';
import { findFactWarnings } from '../resume/facts';

const resumes = Object.values(RESUME_DOCUMENTS).map((doc) => ({
  src: doc.src,
  // The résumés are HTML: decode the entities they use so text can be compared.
  text: readFileSync(resolve(process.cwd(), doc.src), 'utf8').replace(/&amp;/g, '&'),
}));

const factRegister = readFileSync(resolve(process.cwd(), 'content/resume-facts.md'), 'utf8');

const { university, platinumClubCount, goldClubCount, quotaAttainment } = CAREER_FACTS;

describe('career facts stay consistent', () => {
  describe('website (constants.tsx)', () => {
    it('uses the website contact address rather than the résumé address', () => {
      expect(SOCIAL_LINKS.find((link) => link.platform === 'Email')?.url).toBe(
        'mailto:contact@gavrilov.ai'
      );
    });
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
      expect(SYSTEM_CONTEXT).toContain(quotaAttainment);
    });
  });

  describe.each(resumes)('résumé $src', ({ text }) => {
    it('matches the owner-updated project and credential entries in the register', () => {
      const source = new DOMParser().parseFromString(text, 'text/html');
      const plain = source.body.textContent?.replace(/\s+/g, ' ') ?? '';
      for (const phrase of [
        'Azure Solutions Architect Expert',
        'Azure AI Fundamentals',
        'AWS Certified Cloud Practitioner',
        'agentic generative-AI investment research platform',
      ]) {
        expect(plain).toContain(phrase);
        expect(factRegister).toContain(phrase);
      }
      expect(plain).not.toContain('Challenger Insight Selling');
    });
    it('uses the résumé contact address rather than the website address', () => {
      const source = new DOMParser().parseFromString(text, 'text/html');
      const contact = source.querySelector('.contact')?.textContent;
      expect(contact).toContain('michael@gavrilov.ai');
      expect(contact).not.toContain('contact@gavrilov.ai');
    });
    it('matches every shared fact (the editor shows the same check as warnings)', () => {
      expect(findFactWarnings(text)).toEqual([]);
    });
  });

  it('warns about a fact that no longer matches', () => {
    const executive = resumes[0]?.text ?? '';
    expect(
      findFactWarnings(executive.replace('three-time Gold Club', 'four-time Gold Club'))
    ).toEqual([
      `Gold Club should show ${goldClubCount}× to match the website and the AI assistant.`,
    ]);
  });

  describe('fact register (content/resume-facts.md)', () => {
    it('lists the same university and recognition', () => {
      expect(factRegister).toContain(university);
      expect(factRegister).toContain(`Platinum Club: ${platinumClubCount}×`);
      expect(factRegister).toContain(`Gold Club: ${goldClubCount}×`);
      expect(factRegister).toContain(quotaAttainment);
    });
  });
});
