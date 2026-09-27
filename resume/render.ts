/**
 * @fileoverview Fills the résumé template (content/resume.html) for the admin preview and PDF builds.
 * Pure string work with no DOM access, so it runs in the browser, Node and Cloudflare Workers.
 */

export type ResumeVariant = 'hls' | 'enterprise';

export interface RenderOptions {
  variant: ResumeVariant;
  /** Overrides the template's `--fs` (points). */
  fontSizePt?: number;
  /** Overrides the template's `--gap` multiplier. */
  gap?: number;
  /** Replaces the template's `/fonts/` prefix inside `url()`, e.g. a file:// folder for CI. */
  fontBase?: string;
}

export const TITLES = {
  hls: 'Strategic Account Director, Healthcare & Life Sciences',
  enterprise: 'Strategic Account Director, Global Enterprise',
} as const satisfies Record<ResumeVariant, string>;

export const TEMPLATE_FONT_BASE = '/fonts/';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number, got ${value}`);
  }
}

/**
 * Replaces `{{TITLE}}`, optionally rewrites font URLs, and appends a `:root` override
 * for `--fs` / `--gap`. The rest of the markup is left untouched.
 */
export function renderResume(html: string, opts: RenderOptions): string {
  // A function replacer stops `$&`-style patterns in the title from being interpreted.
  let out = html.replace('{{TITLE}}', () => escapeHtml(TITLES[opts.variant]));

  const { fontBase } = opts;
  if (fontBase !== undefined && fontBase !== TEMPLATE_FONT_BASE) {
    out = out.replace(
      /url\(\s*(['"]?)\/fonts\//g,
      (_match, quote: string) => `url(${quote}${fontBase}`
    );
  }

  const overrides: string[] = [];
  if (opts.fontSizePt !== undefined) {
    assertPositive('fontSizePt', opts.fontSizePt);
    overrides.push(`--fs:${opts.fontSizePt}pt`);
  }
  if (opts.gap !== undefined) {
    assertPositive('gap', opts.gap);
    overrides.push(`--gap:${opts.gap}`);
  }
  if (overrides.length > 0) {
    const style = `<style>:root{${overrides.join(';')}}</style>`;
    out = /<\/head>/i.test(out)
      ? out.replace(/<\/head>/i, (closeHead) => `${style}${closeHead}`)
      : `${style}${out}`;
  }

  return out;
}
