/**
 * @fileoverview Tests for the fit-check rules: request validation, JSON parsing, the evidence filter
 * and the unsupported-name guard.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resumeTextForAi } from '../resume/plainText';
import { RESUME_DOCUMENTS } from '../resume/documents';
import {
  createFitCheckGrounding,
  extractJson,
  normalizeForMatch,
  NOT_A_JOB_DESCRIPTION,
  readJobDescription,
  restatesEvidence,
} from '../utils/fitCheck';
import { MAX_JOB_DESCRIPTION_LENGTH, MIN_JOB_DESCRIPTION_LENGTH } from '../utils/fitCheckLimits';

const RESUME = resumeTextForAi(
  readFileSync(resolve(process.cwd(), RESUME_DOCUMENTS.ats.src), 'utf8')
);

const QUOTE =
  'Structured and negotiated strategic agreements exceeding $500M in total contract value';

const JOB =
  'We are hiring a Strategic Account Director to lead executive relationships with a global ' +
  'healthcare customer. You will own C-suite engagement, multi-year account strategy and complex ' +
  'contract negotiation. Experience with Kubernetes and Salesforce is required. Salesforce admin ' +
  'certification preferred. The role partners with Acme sales teams across regions.';

function reply(data: object): string {
  return JSON.stringify(data);
}

describe('readJobDescription', () => {
  const valid = 'x'.repeat(MIN_JOB_DESCRIPTION_LENGTH);

  it('accepts exactly { jobDescription } within the limits', () => {
    expect(readJobDescription({ jobDescription: valid })).toBe(valid);
    const longest = 'y'.repeat(MAX_JOB_DESCRIPTION_LENGTH);
    expect(readJobDescription({ jobDescription: longest })).toBe(longest);
  });

  it('rejects text outside the limits', () => {
    expect(
      readJobDescription({ jobDescription: 'x'.repeat(MIN_JOB_DESCRIPTION_LENGTH - 1) })
    ).toBeNull();
    expect(
      readJobDescription({ jobDescription: 'x'.repeat(MAX_JOB_DESCRIPTION_LENGTH + 1) })
    ).toBeNull();
  });

  it('measures the length after trimming', () => {
    const padded = `  ${'x'.repeat(MIN_JOB_DESCRIPTION_LENGTH - 1)}${' '.repeat(50)}`;
    expect(readJobDescription({ jobDescription: padded })).toBeNull();
  });

  it('rejects anything that is not exactly { jobDescription: string }', () => {
    for (const body of [
      null,
      'text',
      [valid],
      {},
      { jobDescription: 42 },
      { jobDescription: [valid] },
      { jobDescription: valid, extra: true },
      { description: valid },
    ]) {
      expect(readJobDescription(body)).toBeNull();
    }
  });

  it('removes control characters and normalizes line endings', () => {
    const text = `${'a'.repeat(MIN_JOB_DESCRIPTION_LENGTH)}\r\nnext\u0000line`;
    expect(readJobDescription({ jobDescription: text })).toBe(
      `${'a'.repeat(MIN_JOB_DESCRIPTION_LENGTH)}\nnextline`
    );
  });
});

describe('extractJson', () => {
  it('reads plain, fenced and wrapped JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here it is: {"a":1} Hope that helps.')).toEqual({ a: 1 });
  });

  it('returns null for text without valid JSON', () => {
    expect(extractJson('no json here')).toBeNull();
    expect(extractJson('{"a":')).toBeNull();
  });
});

describe('normalizeForMatch', () => {
  it('ignores case, quote style, dash style and spacing', () => {
    expect(normalizeForMatch('Microsoft’s  “AI”\n– 5×')).toBe(`microsoft's "ai" - 5x`);
  });
});

describe('evidence filter', () => {
  const { isResumeQuote } = createFitCheckGrounding(RESUME, JOB);

  it('accepts a verbatim résumé passage', () => {
    expect(isResumeQuote(QUOTE)).toBe(true);
  });

  it('accepts typographic differences, wrapping quotes and a trailing period', () => {
    expect(isResumeQuote(`“${QUOTE.toUpperCase()}.”`)).toBe(true);
    expect(isResumeQuote(QUOTE.replace(/ /g, '  '))).toBe(true);
  });

  it('rejects made-up, paraphrased or shortened quotes', () => {
    expect(isResumeQuote('Deep hands-on Kubernetes expertise across production clusters')).toBe(
      false
    );
    expect(isResumeQuote('Negotiated agreements worth more than $500M')).toBe(false);
    expect(isResumeQuote('Structured and negotiated … total contract value')).toBe(false);
  });

  it('rejects quotes shorter than four words', () => {
    expect(isResumeQuote('Microsoft')).toBe(false);
    expect(isResumeQuote('strategic agreements exceeding')).toBe(false);
  });
});

describe('unsupported-name guard', () => {
  const { mentionsUnsupportedName } = createFitCheckGrounding(RESUME, JOB);

  it('flags tools and companies from the job description that the résumé lacks', () => {
    expect(mentionsUnsupportedName('Brings deep Kubernetes experience')).toBe(true);
    expect(mentionsUnsupportedName('Has run Salesforce programs')).toBe(true);
    expect(mentionsUnsupportedName('Has worked with Acme before')).toBe(true);
  });

  it('allows words the résumé contains and ordinary job-description words', () => {
    expect(mentionsUnsupportedName('Leads C-suite engagement at Microsoft')).toBe(false);
    expect(
      mentionsUnsupportedName('Owns multi-year account strategy and contract negotiation')
    ).toBe(false);
  });
});

describe('parseReply', () => {
  const { parseReply } = createFitCheckGrounding(RESUME, JOB);

  it('keeps grounded points and drops the rest', () => {
    const result = parseReply(
      reply({
        fits: [
          { point: 'Has negotiated large strategic agreements.', evidence: QUOTE },
          { point: 'Knows Kubernetes deeply.', evidence: QUOTE },
          { point: 'Runs global sales teams.', evidence: 'Ran global sales teams for a decade' },
        ],
        transferable: [
          { point: 'Partner experience.', evidence: 'global systems integrator partners' },
        ],
        gaps: ['No Kubernetes experience listed.'],
        questions: ['How has Michael worked with Salesforce?'],
      })
    );

    expect(result).toEqual({
      fits: [{ point: 'Has negotiated large strategic agreements.', evidence: QUOTE }],
      transferable: [
        { point: 'Partner experience.', evidence: 'global systems integrator partners' },
      ],
      gaps: ['No Kubernetes experience listed.'],
      questions: ['How has Michael worked with Salesforce?'],
    });
  });

  it('treats missing lists as empty and ignores extra keys', () => {
    expect(parseReply(reply({ gaps: ['Kubernetes'], extra: 'ignored' }))).toEqual({
      fits: [],
      transferable: [],
      gaps: ['Kubernetes'],
      questions: [],
    });
  });

  it('drops non-string and over-long entries and caps each list at six', () => {
    const result = parseReply(
      reply({ gaps: [1, 'x'.repeat(401), ...Array.from({ length: 8 }, (_, i) => `Gap ${i}`)] })
    );
    expect(result).toMatchObject({
      gaps: ['Gap 0', 'Gap 1', 'Gap 2', 'Gap 3', 'Gap 4', 'Gap 5'],
    });
  });

  it('reports text the model says is not a job description', () => {
    expect(parseReply(reply({ isJobDescription: false }))).toBe(NOT_A_JOB_DESCRIPTION);
    expect(parseReply(reply({ isJobDescription: false, gaps: ['Anything'] }))).toBe(
      NOT_A_JOB_DESCRIPTION
    );
    expect(parseReply(reply({ isJobDescription: true, gaps: ['Kubernetes'] }))).toEqual({
      fits: [],
      transferable: [],
      gaps: ['Kubernetes'],
      questions: [],
    });
  });

  it('returns null for unusable replies', () => {
    expect(parseReply('Sorry, I cannot help with that.')).toBeNull();
    expect(parseReply('[1, 2, 3]')).toBeNull();
    expect(parseReply(reply({ fits: 'not a list' }))).toBeNull();
    expect(
      parseReply(reply({ fits: [{ point: 'Made up', evidence: 'nothing like the résumé' }] }))
    ).toBeNull();
    expect(parseReply(reply({}))).toBeNull();
  });
});

describe('restatesEvidence', () => {
  it('detects a point that repeats its quote', () => {
    expect(
      restatesEvidence(
        '20+ years at Microsoft',
        'Strategic account leader with 20+ years at Microsoft'
      )
    ).toBe(true);
    expect(
      restatesEvidence(
        'Leads a 30+ person matrixed virtual team',
        'leading C-suite strategy across cloud, data and AI, and a 30+ person matrixed virtual team'
      )
    ).toBe(true);
  });

  it('keeps a point that names a job requirement in its own words', () => {
    expect(
      restatesEvidence(
        'Experience in healthcare and life sciences, a regulated industry',
        'executive commercial leadership in healthcare and life sciences.'
      )
    ).toBe(false);
    expect(
      restatesEvidence(
        'Owns C-suite relationships',
        'Own relationships with the CIO, CDO and senior business leaders'
      )
    ).toBe(false);
  });
});
