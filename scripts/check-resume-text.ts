/* eslint-disable no-console */
/**
 * @fileoverview ATS-readability check for the built résumé PDFs: extracts their text with pdf.js
 * and checks page counts, every source block in order, literal bullet counts, placeholders,
 * split words and ligatures. Run with: npm run resume:check (after npm run resume:build).
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { RESUME_DOCUMENTS } from '../resume/documents';
import { findTextProblems } from '../resume/textCheck';
import { htmlToPlainText } from '../resume/plainText';
import { renderResume } from '../resume/render';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function extractText(file: string): Promise<{ text: string; pages: number }> {
  const task = getDocument({
    data: new Uint8Array(readFileSync(file)),
    useSystemFonts: false,
  });
  const pdf = await task.promise;
  const pageTexts: string[] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const content = await (await pdf.getPage(number)).getTextContent();
    pageTexts.push(
      content.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
        .join('')
    );
  }
  const pages = pdf.numPages;
  await task.destroy();
  return { text: pageTexts.join('\n'), pages };
}

async function main(): Promise<void> {
  let failed = false;
  for (const doc of Object.values(RESUME_DOCUMENTS)) {
    const { text, pages } = await extractText(join(ROOT, doc.out));
    const template = readFileSync(join(ROOT, doc.src), 'utf8');
    const expectedText = htmlToPlainText(renderResume(template, { variant: doc.variant })).replace(
      /^- /gm,
      '• '
    );
    const problems = findTextProblems({
      text,
      pages,
      expectedPages: doc.pages,
      requiredText: doc.requiredText,
      expectedText,
    });
    if (problems.length > 0) {
      failed = true;
      console.error(`✗ ${doc.out}:\n  ${problems.join('\n  ')}`);
    } else {
      console.log(`✓ ${doc.out}: ${pages} page(s), text reads cleanly`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
