/**
 * @fileoverview Helpers for the résumé PDF build (scripts/build-resume.ts) and the admin fit meter.
 * No Node or DOM APIs, so it can be imported in the browser too.
 */

export interface FitSetting {
  fontSizePt: number;
  gap: number;
}

/** Tried in order until the résumé fits: largest font first, tightening spacing before shrinking text. */
export const FIT_SETTINGS: readonly FitSetting[] = [9.6, 9.5, 9.4, 9.3, 9.2].flatMap((fontSizePt) =>
  [1, 0.85, 0.7].map((gap) => ({ fontSizePt, gap }))
);

/** US Letter at 96 CSS px per inch. */
export const LETTER_WIDTH_PX = 816;
export const LETTER_HEIGHT_PX = 1056;

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
