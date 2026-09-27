/**
 * @fileoverview Pure helpers for the résumé PDF build (scripts/build-resume.ts).
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

const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

export function countPdfPages(pdf: Uint8Array): number {
  return latin1(pdf).match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0;
}

/** Pins the PDF's creation/modification date so the same input always produces the same bytes. */
export function normalizePdf(pdf: Uint8Array, date: Date): Uint8Array {
  const stamp = date.toISOString().replace(/\D/g, '').slice(0, 14);
  // Same-length replacement keeps the PDF's byte offsets (xref table) valid.
  const text = latin1(pdf).replace(
    /\/(CreationDate|ModDate) \(D:\d{14}/g,
    (_match, key: string) => `/${key} (D:${stamp}`
  );
  return new Uint8Array(Buffer.from(text, 'latin1'));
}
