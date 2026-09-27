/**
 * @fileoverview One-page fit check for the admin preview, mirroring scripts/build-resume.ts.
 */

import { FIT_SETTINGS, LETTER_HEIGHT_PX, type FitSetting } from '../resume/pdf';

export interface FitResult {
  /** First setting that fits, or null when even the smallest one overflows */
  setting: FitSetting | null;
  heightPx: number;
  /** Rough number of lines to cut when it doesn't fit; 0 when it fits */
  overflowLines: number;
}

/** Template line height (`--lh`) used to turn overflow pixels into an approximate line count. */
const TEMPLATE_LINE_HEIGHT = 1.13;

export function overflowLines(heightPx: number, fontSizePt: number): number {
  if (heightPx <= LETTER_HEIGHT_PX) return 0;
  const linePx = fontSizePt * (96 / 72) * TEMPLATE_LINE_HEIGHT;
  return Math.ceil((heightPx - LETTER_HEIGHT_PX) / linePx);
}

/** Tries the build's settings in the same order; `measure` applies one and returns the page height. */
export function findFit(measure: (setting: FitSetting) => number): FitResult {
  let heightPx = 0;
  let last: FitSetting | undefined;
  for (const setting of FIT_SETTINGS) {
    heightPx = measure(setting);
    last = setting;
    if (heightPx <= LETTER_HEIGHT_PX) return { setting, heightPx, overflowLines: 0 };
  }
  return { setting: null, heightPx, overflowLines: overflowLines(heightPx, last?.fontSizePt ?? 0) };
}
