/**
 * @fileoverview Page-fit estimate for the admin preview, mirroring scripts/build-resume.ts
 * (which is exact: it prints and counts pages).
 */

import type { FitSetting } from '../resume/pdf';

export interface FitResult {
  /** First setting that gives exactly `target` pages, or null when none does */
  setting: FitSetting | null;
  /** Estimated pages at `setting`, or at the last setting tried */
  pages: number;
  target: number;
  /** Rough number of lines to cut when still over the target; 0 otherwise */
  overflowLines: number;
}

/** Average template line height, used only to turn overflow pixels into a rough line count. */
const LINE_HEIGHT_ESTIMATE = 1.15;

export function estimatePages(heightPx: number, pageHeightPx: number): number {
  return Math.max(1, Math.ceil(heightPx / pageHeightPx));
}

export function overflowLines(heightPx: number, limitPx: number, fontSizePt: number): number {
  if (heightPx <= limitPx) return 0;
  const linePx = fontSizePt * (96 / 72) * LINE_HEIGHT_ESTIMATE;
  return Math.ceil((heightPx - limitPx) / linePx);
}

/** Tries `settings` in build order; `measure` applies one and returns the content height in px. */
export function findFit(
  settings: readonly FitSetting[],
  target: number,
  pageHeightPx: number,
  measure: (setting: FitSetting) => number
): FitResult {
  let heightPx = 0;
  let pages = 0;
  let last: FitSetting | undefined;
  for (const setting of settings) {
    heightPx = measure(setting);
    pages = estimatePages(heightPx, pageHeightPx);
    last = setting;
    if (pages === target) return { setting, pages, target, overflowLines: 0 };
  }
  return {
    setting: null,
    pages,
    target,
    overflowLines: overflowLines(heightPx, target * pageHeightPx, last?.fontSizePt ?? 0),
  };
}
