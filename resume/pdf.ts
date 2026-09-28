/**
 * @fileoverview Helpers for the résumé PDF build (scripts/build-resume.ts) and the admin fit meter.
 * No Node or DOM APIs, so it can be imported in the browser too.
 */

export interface FitSetting {
  fontSizePt: number;
  gap: number;
}

/** Largest font first; at each size, spacing is tightened before the text shrinks. */
export function buildFitSettings(
  fontSizesPt: readonly number[],
  gaps: readonly number[]
): FitSetting[] {
  return fontSizesPt.flatMap((fontSizePt) => gaps.map((gap) => ({ fontSizePt, gap })));
}

/** US Letter at 96 CSS px per inch. */
export const LETTER_WIDTH_PX = 816;
export const LETTER_HEIGHT_PX = 1056;

export interface PageMarginsPx {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const PX_PER_UNIT: Readonly<Record<string, number>> = {
  in: 96,
  pt: 96 / 72,
  px: 1,
  mm: 96 / 25.4,
  cm: 96 / 2.54,
};

/** Reads the `@page { margin: … }` shorthand (1-4 lengths); unknown or missing values count as 0. */
export function parsePageMarginsPx(html: string): PageMarginsPx {
  const block = /@page\s*\{([^}]*)\}/i.exec(html)?.[1] ?? '';
  const value = /(?:^|;|\s)margin\s*:\s*([^;]+)/i.exec(block)?.[1] ?? '0';
  const lengths = value
    .trim()
    .split(/\s+/)
    .map((part) => {
      const match = /^(\d*\.?\d+)(in|pt|px|mm|cm)?$/i.exec(part);
      const unit = match?.[2]?.toLowerCase() ?? 'px';
      return match ? Number(match[1]) * (PX_PER_UNIT[unit] ?? 0) : 0;
    });
  const [top = 0, right = top, bottom = top, left = right] = lengths;
  return { top, right, bottom, left };
}

// One char per byte (0-255). TextDecoder('latin1') is windows-1252 in browsers, so it isn't 1:1.
function bytesToLatin1(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return text;
}

function latin1ToBytes(text: string): Uint8Array {
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

export function countPdfPages(pdf: Uint8Array): number {
  return bytesToLatin1(pdf).match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0;
}

/** Pins the PDF's creation/modification date so the same input always produces the same bytes. */
export function normalizePdf(pdf: Uint8Array, date: Date): Uint8Array {
  const stamp = date.toISOString().replace(/\D/g, '').slice(0, 14);
  // Same-length replacement keeps the PDF's byte offsets (xref table) valid.
  const text = bytesToLatin1(pdf).replace(
    /\/(CreationDate|ModDate) \(D:\d{14}/g,
    (_match, key: string) => `/${key} (D:${stamp}`
  );
  return latin1ToBytes(text);
}
