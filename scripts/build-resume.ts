/* eslint-disable no-console */
/**
 * @fileoverview Builds every résumé PDF in resume/documents.ts, adjusting font size and spacing until
 * each has exactly its target page count. Writes nothing unless every document hits its target.
 * Run with: npm run resume:build
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { renderResume } from '../resume/render';
import { validateResumeHtml } from '../resume/validate';
import { RESUME_DOCUMENTS, type ResumeDocument } from '../resume/documents';
import {
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  countPdfPages,
  normalizePdf,
  type FitSetting,
} from '../resume/pdf';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = join(ROOT, 'public', 'fonts');
// Fake origin served entirely from memory/disk via page.route; nothing leaves the machine.
const ORIGIN = 'https://resume.local';

interface BuiltPdf {
  doc: ResumeDocument;
  pdf: Uint8Array;
  setting: FitSetting;
}

/** Last commit touching the résumé sources, so rebuilding unchanged content gives identical bytes. */
function sourceDate(): Date {
  try {
    const iso = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', 'content', 'resume', 'public/fonts'],
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

async function printPdf(page: Page): Promise<Uint8Array> {
  await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page.pdf({ printBackground: true, preferCSSPageSize: true });
}

async function buildDocument(
  page: Page,
  doc: ResumeDocument,
  date: Date,
  setHtml: (html: string) => void
): Promise<BuiltPdf> {
  const template = readFileSync(join(ROOT, doc.src), 'utf8');
  const { ok, errors } = validateResumeHtml(template, { pageMargin: doc.pageMargin });
  if (!ok) throw new Error(`${doc.src} is invalid:\n  ${errors.join('\n  ')}`);

  const tried: string[] = [];
  for (const setting of doc.fit) {
    setHtml(renderResume(template, { variant: 'enterprise', ...setting }));
    const pdf = await printPdf(page);
    const pages = countPdfPages(pdf);
    if (pages === doc.pages) return { doc, pdf: normalizePdf(pdf, date), setting };
    tried.push(`${setting.fontSizePt}pt/${setting.gap} → ${pages}`);
  }
  throw new Error(
    `${doc.src}: no setting gives exactly ${doc.pages} page(s) (${tried.join(', ')}). ` +
      'Shorten it if pages are over, or lengthen it if under.'
  );
}

async function main(): Promise<void> {
  const date = sourceDate();
  // Windows (incl. ARM64) uses the installed Edge; CI uses Playwright's bundled Chromium.
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  const built: BuiltPdf[] = [];
  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: LETTER_WIDTH_PX, height: LETTER_HEIGHT_PX },
    });
    const page = await context.newPage();
    await page.emulateMedia({ media: 'print' });
    let html = '';
    await serveFromDisk(page, () => html);

    for (const doc of Object.values(RESUME_DOCUMENTS)) {
      built.push(
        await buildDocument(page, doc, date, (next) => {
          html = next;
        })
      );
    }
  } finally {
    await browser.close();
  }

  // Only write once every document has hit its target, so a failure never leaves a mixed set.
  for (const { doc, pdf, setting } of built) {
    writeFileSync(join(ROOT, doc.out), pdf);
    console.log(`${doc.out}: ${doc.pages} page(s) at ${setting.fontSizePt}pt, gap ${setting.gap}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
