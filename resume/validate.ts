/**
 * @fileoverview Checks content/resume.html against the template contract.
 * Runs in the admin editor (live feedback) and in the admin Function (authoritative),
 * so it must stay DOM-free and rely on string/regex checks only.
 */

export interface ResumeValidationResult {
  ok: boolean;
  errors: string[];
}

export const MAX_RESUME_BYTES = 100 * 1024;
export const ALLOWED_FONT_PREFIX = '/fonts/';

interface PatternRule {
  pattern: RegExp;
  message: (match: RegExpExecArray) => string;
}

const FORBIDDEN_PATTERNS: readonly PatternRule[] = [
  {
    pattern: /<\s*script\b/gi,
    message: () => 'Remove the <script> tag. Scripts are not allowed.',
  },
  {
    pattern: /<\s*(iframe|frame|frameset|object|embed|link|base|form|portal)\b/gi,
    message: (m) => `Remove the <${m[1]?.toLowerCase()}> tag. It is not allowed.`,
  },
  {
    pattern: /<\s*meta\b[^>]*\bhttp-equiv\b/gi,
    message: () => 'Remove <meta http-equiv>. It is not allowed.',
  },
  {
    pattern: /<[a-z][^>]*?\son[a-z]+\s*=/gi,
    message: () => 'Remove the event-handler attribute (on…=). Inline handlers are not allowed.',
  },
  {
    pattern: /(?:j\s*a\s*v\s*a|v\s*b)\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi,
    message: () => 'Remove the script URL (javascript: / vbscript:).',
  },
  {
    pattern: /@import\b/gi,
    message: () => 'Remove @import. Put all CSS in the single <style> block.',
  },
  {
    pattern:
      /\s(?:src|srcset|poster|data|background|action|formaction)\s*=\s*["']?\s*(?:https?:)?\/\//gi,
    message: () => 'Remove the external resource. Images and fonts must be local files.',
  },
];

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

function checkStructure(html: string, errors: string[]): void {
  if (!/^\s*<!doctype html>/i.test(html)) {
    errors.push('Start the file with <!DOCTYPE html>.');
  }
  if (!/<\/html>\s*$/i.test(html)) {
    errors.push('End the file with </html>.');
  }

  const titleCount = countOccurrences(html, '{{TITLE}}');
  if (titleCount !== 1) {
    errors.push(`{{TITLE}} must appear exactly once (found ${titleCount}).`);
  }

  const rootBlock = /:root\s*\{([^}]*)\}/i.exec(html)?.[1] ?? '';
  for (const variable of ['--fs', '--gap']) {
    if (!new RegExp(`${variable}\\s*:`).test(rootBlock)) {
      errors.push(`Define ${variable} inside :root { … }. The one-page fit uses it.`);
    }
    if (!html.includes(`var(${variable})`)) {
      errors.push(`Use var(${variable}) in the CSS. The one-page fit relies on it.`);
    }
  }

  const pageBlock = /@page\s*\{([^}]*)\}/i.exec(html)?.[1];
  if (
    pageBlock === undefined ||
    !/\bsize\s*:\s*letter\b/i.test(pageBlock) ||
    !/\bmargin\s*:\s*0(?:in|pt|px|mm|cm)?\s*(?:;|$)/i.test(pageBlock)
  ) {
    errors.push('Keep @page { size: Letter; margin: 0; } in the CSS.');
  }
}

function checkUrls(html: string, errors: string[]): void {
  const urlPattern = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
  for (const match of html.matchAll(urlPattern)) {
    const value = (match[2] ?? '').trim();
    if (!value.startsWith(ALLOWED_FONT_PREFIX) || value.includes('..')) {
      errors.push(
        `Line ${lineOf(html, match.index)}: url(${value}) is not allowed. Use files under ${ALLOWED_FONT_PREFIX}.`
      );
    }
  }
}

function checkForbidden(html: string, errors: string[]): void {
  for (const rule of FORBIDDEN_PATTERNS) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(html)) !== null) {
      errors.push(`Line ${lineOf(html, match.index)}: ${rule.message(match)}`);
    }
  }
}

/** Returns every contract violation as a readable message; `ok` is true when there are none. */
export function validateResumeHtml(html: string): ResumeValidationResult {
  const bytes = new TextEncoder().encode(html).length;
  if (bytes > MAX_RESUME_BYTES) {
    return {
      ok: false,
      errors: [
        `The file is ${Math.ceil(bytes / 1024)} KB. The limit is ${MAX_RESUME_BYTES / 1024} KB.`,
      ],
    };
  }

  const errors: string[] = [];
  checkStructure(html, errors);
  checkUrls(html, errors);
  checkForbidden(html, errors);
  return { ok: errors.length === 0, errors };
}
