/**
 * @fileoverview Applies fit settings to résumé HTML for the admin preview and PDF builds.
 * Pure string work with no DOM access, so it runs in the browser, Node and Cloudflare Workers.
 */

export interface RenderOptions {
  /** Overrides the template's `--fs` (points). */
  fontSizePt?: number;
  /** Overrides the template's `--gap` multiplier. */
  gap?: number;
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number, got ${value}`);
  }
}

/**
 * Appends a `:root` override for `--fs` / `--gap` without changing the résumé content.
 */
export function renderResume(html: string, opts: RenderOptions = {}): string {
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
    return /<\/head>/i.test(html)
      ? html.replace(/<\/head>/i, (closeHead) => `${style}${closeHead}`)
      : `${style}${html}`;
  }

  return html;
}
