/**
 * @fileoverview Registry of résumé documents. The only place that maps a document id to repo paths:
 * the admin API accepts an id and looks it up here, never a raw path.
 */

import { buildFitSettings, type FitSetting } from './pdf';
import { TITLES, type ResumeVariant } from './render';

export type ResumeDocId = 'executive' | 'ats';

export interface ResumeDocument {
  id: ResumeDocId;
  label: string;
  /** Source HTML, relative to the repo root */
  src: string;
  /** Built PDF, relative to the repo root */
  out: string;
  /** The build must produce exactly this many pages */
  pages: number;
  variant: ResumeVariant;
  /** Tried in order until the PDF has exactly `pages` pages */
  fit: readonly FitSetting[];
  /** 'zero' requires `@page { margin: 0 }` (single-page design); 'any' allows print margins */
  pageMargin: 'zero' | 'any';
  /** Conventional-commit scope for edits published from the admin editor */
  commitScope: string;
  /** Must appear in this order in the PDF's extracted text (scripts/check-resume-text.ts) */
  requiredText: readonly string[];
}

const CURRENT_ROLE = 'Strategic Account Director, Healthcare & Life Sciences';

export const RESUME_DOCUMENTS: Readonly<Record<ResumeDocId, ResumeDocument>> = {
  executive: {
    id: 'executive',
    label: 'Executive',
    src: 'content/resume.html',
    out: 'public/CV/MGavrilovCV.pdf',
    pages: 1,
    variant: 'hls',
    fit: buildFitSettings([10.5, 10.25, 10], [1, 0.9, 0.8]),
    pageMargin: 'zero',
    commitScope: 'resume',
    requiredText: [
      'Michael Gavrilov',
      TITLES.hls,
      'Executive Summary',
      'Core Expertise',
      'Professional Experience',
      CURRENT_ROLE,
      'Senior Account Executive, Enterprise Accounts',
      'Account Technology Strategist, Enterprise Accounts',
      'Partner Technology Strategist',
      'IT Solutions Architect',
      'IT Operations Manager / Team Lead',
      'Education',
      'Certifications & Executive Education',
    ],
  },
  ats: {
    id: 'ats',
    label: 'ATS',
    src: 'content/resume-ats.html',
    out: 'public/CV/MGavrilovCV-ATS.pdf',
    pages: 2,
    variant: 'hls',
    fit: buildFitSettings([11, 10.75, 10.5, 10.25], [1, 0.85, 0.7]),
    pageMargin: 'any',
    commitScope: 'resume-ats',
    requiredText: [
      'Michael Gavrilov',
      TITLES.hls,
      'Executive Summary',
      'Core Expertise',
      'Professional Experience',
      CURRENT_ROLE,
      'Senior Account Executive, Enterprise Accounts',
      'Account Technology Strategist, Enterprise Accounts',
      'Partner Technology Strategist',
      'IT Solutions Architect',
      'IT Operations Manager / Team Lead',
      'Selected Projects',
      'Education',
      'Certifications & Executive Education',
      'Community',
    ],
  },
};

export const RESUME_DOC_IDS = Object.keys(RESUME_DOCUMENTS) as ResumeDocId[];
export const DEFAULT_DOC_ID: ResumeDocId = 'executive';

/** Allow-list lookup: anything that isn't a registered id returns null. */
export function getResumeDocument(id: string | null | undefined): ResumeDocument | null {
  return id && Object.prototype.hasOwnProperty.call(RESUME_DOCUMENTS, id)
    ? RESUME_DOCUMENTS[id as ResumeDocId]
    : null;
}

/** Site URL of a document's PDF (public/ is the web root). */
export function pdfUrl(doc: ResumeDocument): string {
  return `/${doc.out.replace(/^public\//, '')}`;
}
