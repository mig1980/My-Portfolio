/**
 * @fileoverview Shows progress of the PDF build after publishing.
 */

import { memo } from 'react';

export type BuildState =
  | { phase: 'idle' }
  | { phase: 'building'; commitSha: string; startedAt: number }
  | { phase: 'done'; pdfUrl: string }
  | { phase: 'failed'; runUrl: string }
  | { phase: 'timeout' };

const linkClass = 'font-semibold underline underline-offset-2 focus-ring';

const BuildStatus = memo(({ build }: { build: BuildState }) => {
  switch (build.phase) {
    case 'idle':
      return null;
    case 'building':
      return (
        <p role="status" className="text-sm text-primary-800">
          Saved to GitHub. Building the PDF (usually 2–3 minutes)…
        </p>
      );
    case 'done':
      return (
        <p role="status" className="text-sm text-emerald-800">
          ✓ PDF built. The website updates within a minute or two.{' '}
          <a href={build.pdfUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Open the new PDF
          </a>
        </p>
      );
    case 'failed':
      return (
        <p role="alert" className="text-sm text-red-800">
          ✗ The PDF build failed, so the website still has the previous PDF.{' '}
          <a href={build.runUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            See what went wrong
          </a>
        </p>
      );
    case 'timeout':
      return (
        <p role="status" className="text-sm text-amber-800">
          The PDF build is taking longer than usual. Check back in a few minutes.
        </p>
      );
  }
});

BuildStatus.displayName = 'BuildStatus';

export default BuildStatus;
