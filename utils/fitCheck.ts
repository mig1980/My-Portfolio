/**
 * @fileoverview Fit check rules shared by the fit API and its tests: request validation, and the
 * checks that keep the AI's answer grounded in the résumé. No DOM or Node APIs.
 */

import type { FitCheckPoint, FitCheckResult } from '../types';
import { MAX_JOB_DESCRIPTION_LENGTH, MIN_JOB_DESCRIPTION_LENGTH } from './fitCheckLimits';

const MAX_ITEMS = 6;
const MAX_TEXT_LENGTH = 400;
const MIN_EVIDENCE_WORDS = 4;
const MAX_EVIDENCE_LENGTH = 300;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}+#.&'-]*[\p{L}\p{N}+#]|[\p{L}\p{N}]/gu;
const SENTENCE_BREAK = /[\n.!?:;•*()–—]/;
const WRAPPING_QUOTES = /^["'“”‘’\s]+|["'“”‘’\s]+$/g;

/** The job description from a request body, cleaned; null unless it's exactly `{ jobDescription }` in range. */
export function readJobDescription(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'jobDescription') return null;

  const value: unknown = (body as Record<string, unknown>).jobDescription;
  if (typeof value !== 'string' || value.length > MAX_JOB_DESCRIPTION_LENGTH) return null;

  const cleaned = value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').trim();
  return cleaned.length >= MIN_JOB_DESCRIPTION_LENGTH ? cleaned : null;
}

/** Lowercase, straight quotes, plain hyphens, single spaces: a quote matches despite typography. */
export function normalizeForMatch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‚‛′`]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/×/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

function toWordKey(word: string): string {
  return normalizeForMatch(word).replace(/'s$/, '');
}

/**
 * Tool, product and company names in the job description that the résumé never mentions.
 * A word counts as a name when it's capitalized mid-sentence (or has inner capitals or digits)
 * and never appears in lowercase in the job description.
 */
function findUnsupportedNames(
  jobDescription: string,
  resumeWords: ReadonlySet<string>
): Set<string> {
  const candidates = new Set<string>();
  const lowercaseWords = new Set<string>();
  let previousEnd = 0;

  for (const match of jobDescription.matchAll(WORD)) {
    const word = match[0];
    const index = match.index ?? 0;
    const sentenceStart =
      previousEnd === 0 || SENTENCE_BREAK.test(jobDescription.slice(previousEnd, index));
    previousEnd = index + word.length;

    if (word === word.toLowerCase()) {
      lowercaseWords.add(toWordKey(word));
      continue;
    }
    const nameLike = !sentenceStart || /\p{Lu}/u.test(word.slice(1)) || /[\d+#]/.test(word);
    if (nameLike && word.length > 1) candidates.add(toWordKey(word));
  }

  const names = new Set<string>();
  for (const key of candidates) {
    if (!lowercaseWords.has(key) && !resumeWords.has(key)) names.add(key);
  }
  return names;
}

function wordKeys(text: string): string[] {
  return (text.match(WORD) ?? []).map(toWordKey);
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
  return text.length > 0 && text.length <= MAX_TEXT_LENGTH ? text : null;
}

/** Missing lists count as empty; a list of the wrong type makes the whole reply unusable. */
function readList(value: unknown): unknown[] | null {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The JSON object in a model reply, tolerating code fences or text around it. */
export function extractJson(reply: string): unknown {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(reply.slice(start, end + 1));
  } catch {
    return null;
  }
}

export interface FitCheckGrounding {
  /** True when `evidence` is a verbatim passage of the résumé, at least 4 words long */
  isResumeQuote: (evidence: string) => boolean;
  /** True when `point` names a tool, product or company from the job description that the résumé lacks */
  mentionsUnsupportedName: (point: string) => boolean;
  /** Validated, filtered result; null when the reply is unusable */
  parseReply: (reply: string) => FitCheckResult | null;
}

/** Builds the grounding checks for one job description against the résumé text. */
export function createFitCheckGrounding(
  resumeText: string,
  jobDescription: string
): FitCheckGrounding {
  const resume = normalizeForMatch(resumeText);
  const resumeWords = new Set(wordKeys(resumeText));
  const unsupportedNames = findUnsupportedNames(jobDescription, resumeWords);

  const isResumeQuote = (evidence: string): boolean => {
    const quote = normalizeForMatch(evidence)
      .replace(/^[\s"'\-•*]+/, '')
      .replace(/[\s"'.,;:]+$/, '');
    return (
      quote.length <= MAX_EVIDENCE_LENGTH &&
      quote.split(' ').length >= MIN_EVIDENCE_WORDS &&
      resume.includes(quote)
    );
  };

  const mentionsUnsupportedName = (point: string): boolean =>
    wordKeys(point).some((key) => unsupportedNames.has(key));

  const toPoint = (item: unknown): FitCheckPoint | null => {
    if (!isRecord(item)) return null;
    const point = cleanText(item.point);
    const evidence = cleanText(item.evidence);
    if (!point || !evidence || !isResumeQuote(evidence) || mentionsUnsupportedName(point)) {
      return null;
    }
    return { point, evidence: evidence.replace(WRAPPING_QUOTES, '') };
  };

  const parseReply = (reply: string): FitCheckResult | null => {
    const data = extractJson(reply);
    if (!isRecord(data)) return null;

    const fits = readList(data.fits);
    const transferable = readList(data.transferable);
    const gaps = readList(data.gaps);
    const questions = readList(data.questions);
    if (!fits || !transferable || !gaps || !questions) return null;

    const keepPoints = (items: unknown[]): FitCheckPoint[] =>
      items
        .map(toPoint)
        .filter((item): item is FitCheckPoint => item !== null)
        .slice(0, MAX_ITEMS);
    const keepStrings = (items: unknown[]): string[] =>
      items
        .map(cleanText)
        .filter((item): item is string => item !== null)
        .slice(0, MAX_ITEMS);

    const result: FitCheckResult = {
      fits: keepPoints(fits),
      transferable: keepPoints(transferable),
      gaps: keepStrings(gaps),
      questions: keepStrings(questions),
    };
    const isEmpty = Object.values(result).every((list: unknown[]) => list.length === 0);
    return isEmpty ? null : result;
  };

  return { isResumeQuote, mentionsUnsupportedName, parseReply };
}
