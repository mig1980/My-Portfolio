/* eslint-disable no-console */
/**
 * @fileoverview Builds public/CV/MGavrilovCV.pdf (Enterprise title) from content/resume.html,
 * shrinking it until it fits on one page. Run with: npm run resume:build
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { renderResume } from '../resume/render';
import { validateResumeHtml } from '../resume/validate';
import {
  FIT_SETTINGS,
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  countPdfPages,
  normalizePdf,
  type FitSetting,
} from '../resume/pdf';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_PATH = join(ROOT, 'content', 'resume.html');
const FONTS_DIR = join(ROOT, 'public', 'fonts');
const PUBLIC_PDF_PATH = join(ROOT, 'public', 'CV', 'MGavrilovCV.pdf');
// Fake origin served entirely from memory/disk via page.route; nothing leaves the machine.
const ORIGIN = 'https://resume.local';

/** Last commit touching the résumé sources, so rebuilding unchanged content gives identical bytes. */
function sourceDate(): Date {
  try {
    const iso = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', 'content/resume.html', 'resume', 'public/fonts'],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (iso) return new Date(iso);
  } catch {
    // Not a git checkout; fall through.
  }
  return new Date();
}

async function serveFromDisk(page: Page, getHtml: () => string): Promise<void> {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) return route.abort();
    if (url.pathname === '/') {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: getHtml() });
    }
    const fontFile = resolve(
      FONTS_DIR,
      `.${decodeURIComponent(url.pathname.replace(/^\/fonts/, ''))}`
    );
    if (
      url.pathname.startsWith('/fonts/') &&
      fontFile.startsWith(FONTS_DIR + sep) &&
      existsSync(fontFile)
    ) {
      return route.fulfill({ contentType: 'font/woff2', body: readFileSync(fontFile) });
    }
    return route.abort();
  });
}

async function measureHeight(page: Page): Promise<number> {
  await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });
  return page.evaluate(() => document.fonts.ready.then(() => document.body.scrollHeight));
}

async function buildPdf(
  page: Page,
  template: string,
  date: Date,
  setHtml: (html: string) => void
): Promise<{ pdf: Uint8Array; setting: FitSetting }> {
  for (const setting of FIT_SETTINGS) {
    setHtml(renderResume(template, { variant: 'enterprise', ...setting }));
    if ((await measureHeight(page)) > LETTER_HEIGHT_PX) continue;

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    if (countPdfPages(pdf) === 1) return { pdf: normalizePdf(pdf, date), setting };
  }
  throw new Error('The résumé does not fit on one page even at the smallest setting. Shorten it.');
}

async function main(): Promise<void> {
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const { ok, errors } = validateResumeHtml(template);
  if (!ok) throw new Error(`content/resume.html is invalid:\n  ${errors.join('\n  ')}`);
  const date = sourceDate();

  // Windows (incl. ARM64) uses the installed Edge; CI uses Playwright's bundled Chromium.
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: LETTER_WIDTH_PX, height: LETTER_HEIGHT_PX },
    });
    const page = await context.newPage();
    await page.emulateMedia({ media: 'print' });
    let html = '';
    await serveFromDisk(page, () => html);

    const { pdf, setting } = await buildPdf(page, template, date, (next) => {
      html = next;
    });
    writeFileSync(PUBLIC_PDF_PATH, pdf);
    console.log(`${PUBLIC_PDF_PATH}: 1 page at ${setting.fontSizePt}pt, gap ${setting.gap}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
