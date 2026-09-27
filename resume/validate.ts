/**
 * @fileoverview Checks a résumé template against the template contract.
 * Runs in the admin editor (live feedback) and in the admin Function (authoritative),
 * so it must stay DOM-free and rely on string/regex checks only.
 *
 * External-resource checks are decode-first: HTML entities and CSS escapes are decoded and "\" is
 * treated as "/" (as browsers do) before any URL is judged, so encodings can't hide a URL.
 */

export interface ResumeValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ValidateOptions {
  /** 'zero' (default) requires `@page { margin: 0 }`; 'any' allows print margins (multi-page documents). */
  pageMargin?: 'zero' | 'any';
}

export const MAX_RESUME_BYTES = 100 * 1024;
export const ALLOWED_FONT_PREFIX = '/fonts/';

interface PatternRule {
  pattern: RegExp;
  message: (match: RegExpExecArray) => string;
}

/** Tag and attribute-name rules; names can't be entity- or CSS-encoded, so these run on the raw HTML. */
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
    pattern: /<[a-z][^>]*?[\s/"']on[a-z]+\s*=/gi,
    message: () => 'Remove the event-handler attribute (on…=). Inline handlers are not allowed.',
  },
];

/** Attributes whose value is fetched or navigated to. Values of the list kinds hold several URLs. */
const URL_ATTRIBUTES: Readonly<Record<string, 'single' | 'srcset' | 'spaces'>> = {
  src: 'single',
  href: 'single',
  'xlink:href': 'single',
  poster: 'single',
  data: 'single',
  background: 'single',
  action: 'single',
  formaction: 'single',
  cite: 'single',
  longdesc: 'single',
  lowsrc: 'single',
  dynsrc: 'single',
  manifest: 'single',
  icon: 'single',
  codebase: 'single',
  profile: 'single',
  usemap: 'single',
  srcset: 'srcset',
  imagesrcset: 'srcset',
  ping: 'spaces',
  archive: 'spaces',
};

const LINK_TAGS = new Set(['a']);

/** Named entities that can spell URL syntax; letters can only be hidden with numeric references. */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: '\u00a0',
  colon: ':',
  sol: '/',
  bsol: '\\',
  period: '.',
  comma: ',',
  semi: ';',
  excl: '!',
  quest: '?',
  num: '#',
  percnt: '%',
  equals: '=',
  plus: '+',
  commat: '@',
  lpar: '(',
  rpar: ')',
  lsqb: '[',
  rsqb: ']',
  lcub: '{',
  rcub: '}',
  lowbar: '_',
  verbar: '|',
  grave: '`',
  Tab: '\t',
  NewLine: '\n',
};

// Quote-aware so a ">" inside an attribute value can't end the tag early and hide later attributes.
const TAG_PATTERN = /<([a-z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const ATTRIBUTE_PATTERN = /([^\s"'<>/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
const STYLE_BLOCK_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const CSS_URL_PATTERN = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
/** Fetchable absolute URLs in CSS text, with or without slashes (e.g. "https:host"), or "//host". */
const CSS_EXTERNAL_PATTERN = /\b(?:https?|ftp|wss?|file)\s*:|(?<![\w.:/-])\/\/\s*[a-z0-9]/i;

function codePoint(code: number): string {
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
}

/** Decodes numeric character references and the named entities that matter for URLs. */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec: string) => codePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

/** Decodes CSS escapes: `\69` → "i", `\2f ` → "/", `\:` → ":". */
function decodeCssEscapes(css: string): string {
  return css.replace(
    /\\([0-9a-f]{1,6})[ \t\n\r\f]?|\\([\s\S])/gi,
    (_m, hex?: string, char?: string) => (hex ? codePoint(parseInt(hex, 16)) : (char ?? ''))
  );
}

/** Trims C0 controls and spaces, as the URL parser does. */
function trimControls(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value.charCodeAt(start) <= 0x20) start++;
  while (end > start && value.charCodeAt(end - 1) <= 0x20) end--;
  return value.slice(start, end);
}

/** What a URL value resolves to, judged the way a browser parses it. */
function classifyUrl(raw: string): 'ok' | 'external' | 'script' {
  const value = trimControls(raw.replace(/\\/g, '/').replace(/[\t\n\r]/g, ''));
  if (value === '' || value.startsWith('#')) return 'ok';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (scheme === 'javascript' || scheme === 'vbscript') return 'script';
  if (scheme === 'data') return 'ok';
  if (scheme || value.startsWith('//')) return 'external';
  return 'ok';
}

function urlCandidates(value: string, kind: 'single' | 'srcset' | 'spaces'): string[] {
  if (kind === 'single') return [value];
  if (kind === 'spaces') return value.split(/\s+/).filter(Boolean);
  // srcset: "url [descriptor], url [descriptor], …"; every candidate is fetchable.
  return value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0] ?? '')
    .filter(Boolean);
}

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

function checkStructure(html: string, options: ValidateOptions, errors: string[]): void {
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
      errors.push(`Define ${variable} inside :root { … }. The page fit uses it.`);
    }
    if (!html.includes(`var(${variable})`)) {
      errors.push(`Use var(${variable}) in the CSS. The page fit relies on it.`);
    }
  }

  const pageBlock = /@page\s*\{([^}]*)\}/i.exec(html)?.[1];
  const zeroMargin = options.pageMargin !== 'any';
  if (
    pageBlock === undefined ||
    !/\bsize\s*:\s*letter\b/i.test(pageBlock) ||
    (zeroMargin && !/\bmargin\s*:\s*0(?:in|pt|px|mm|cm)?\s*(?:;|$)/i.test(pageBlock))
  ) {
    errors.push(
      zeroMargin
        ? 'Keep @page { size: Letter; margin: 0; } in the CSS.'
        : 'Keep @page { size: Letter; … } in the CSS.'
    );
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

/**
 * Checks CSS from a <style> block or style="" attribute. `line` is where the CSS starts in the
 * file; line numbers inside it are approximate once escapes are decoded.
 */
function checkCss(rawCss: string, line: number, errors: string[]): void {
  const css = decodeCssEscapes(decodeEntities(rawCss)).replace(/\\/g, '/');
  const at = (index: number): string => `Line ${line + lineOf(css, index) - 1}`;

  for (const match of css.matchAll(/@import\b/gi)) {
    errors.push(`${at(match.index)}: Remove @import. Put all CSS in the single <style> block.`);
  }

  for (const match of css.matchAll(CSS_URL_PATTERN)) {
    const value = (match[2] ?? '').trim();
    const isFont = value.startsWith(ALLOWED_FONT_PREFIX) && !value.includes('..');
    if (!isFont && !value.startsWith('#')) {
      errors.push(
        `${at(match.index)}: url(${value}) is not allowed. Use files under ${ALLOWED_FONT_PREFIX}.`
      );
    }
  }

  // url(...) was judged above; blank it out (same length) so it isn't reported twice.
  const rest = css.replace(/url\([^)]*\)/gi, (m) => ' '.repeat(m.length));
  const external = CSS_EXTERNAL_PATTERN.exec(rest);
  if (external) {
    errors.push(
      `${at(external.index)}: Remove the external URL from the CSS. Fonts and images must be local files.`
    );
  }
}

function checkStyleBlocks(html: string, errors: string[]): void {
  for (const match of html.matchAll(STYLE_BLOCK_PATTERN)) {
    const css = match[1] ?? '';
    checkCss(css, lineOf(html, match.index + match[0].indexOf(css)), errors);
  }
}

/** Allow-list for every URL-bearing attribute: relative paths, data:, #fragments; <a> may link out. */
function checkAttributes(html: string, errors: string[]): void {
  for (const tag of html.matchAll(TAG_PATTERN)) {
    const tagName = (tag[1] ?? '').toLowerCase();
    const attributes = tag[2] ?? '';
    const line = lineOf(html, tag.index);

    for (const attribute of attributes.matchAll(ATTRIBUTE_PATTERN)) {
      const name = (attribute[1] ?? '').toLowerCase();
      const rawValue = attribute[2];
      if (rawValue === undefined) continue;
      const value = decodeEntities(rawValue.replace(/^(["'])([\s\S]*)\1$/, '$2'));

      if (name === 'style') {
        checkCss(value, line, errors);
        continue;
      }
      // Presentation attributes such as fill="url(…)" load resources too.
      if (/url\s*\(/i.test(decodeCssEscapes(value))) {
        checkCss(value, line, errors);
      }

      const kind = URL_ATTRIBUTES[name];
      if (!kind) continue;
      const isLink = LINK_TAGS.has(tagName) && (name === 'href' || name === 'xlink:href');
      for (const candidate of urlCandidates(value, kind)) {
        const verdict = classifyUrl(candidate);
        if (verdict === 'script') {
          errors.push(`Line ${line}: Remove the script URL (javascript: / vbscript:).`);
        } else if (verdict === 'external' && !isLink) {
          errors.push(
            name === 'href' || name === 'xlink:href'
              ? `Line ${line}: Remove the external resource. Only <a> links may point to other sites.`
              : `Line ${line}: Remove the external resource. Images and fonts must be local files.`
          );
        }
      }
    }
  }
}

/** Returns every contract violation as a readable message; `ok` is true when there are none. */
export function validateResumeHtml(
  html: string,
  options: ValidateOptions = {}
): ResumeValidationResult {
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
  checkStructure(html, options, errors);
  checkStyleBlocks(html, errors);
  checkAttributes(html, errors);
  checkForbidden(html, errors);
  return { ok: errors.length === 0, errors };
}
