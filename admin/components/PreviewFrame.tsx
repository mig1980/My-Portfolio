/**
 * @fileoverview Live résumé preview at Letter width, with the page-fit estimate.
 * @description The iframe is sandboxed WITHOUT allow-scripts, so the HTML can never run code.
 * allow-same-origin is required so fonts load and the fit check can measure the page.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  LETTER_HEIGHT_PX,
  LETTER_WIDTH_PX,
  parsePageMarginsPx,
  type FitSetting,
  type PageMarginsPx,
} from '../../resume/pdf';
import type { ResumeDocument } from '../../resume/documents';
import { findFit, type FitResult } from '../fit';

interface PreviewFrameProps {
  srcDoc: string;
  doc: ResumeDocument;
  /** Called after each load with the result and the exact HTML that was measured. */
  onFit: (result: FitResult, srcDoc: string) => void;
}

interface Layout {
  margins: PageMarginsPx;
  /** Content height available on one page */
  pageHeightPx: number;
  /** Multi-page documents use @page margins, which the screen preview has to imitate */
  isPaged: boolean;
}

function layoutFor(doc: ResumeDocument, srcDoc: string): Layout {
  const isPaged = doc.pageMargin === 'any';
  const margins = isPaged ? parsePageMarginsPx(srcDoc) : { top: 0, right: 0, bottom: 0, left: 0 };
  return { margins, pageHeightPx: LETTER_HEIGHT_PX - margins.top - margins.bottom, isPaged };
}

function applySetting(frame: Document, setting: FitSetting, layout: Layout): number {
  frame.documentElement.style.setProperty('--fs', `${setting.fontSizePt}pt`);
  frame.documentElement.style.setProperty('--gap', String(setting.gap));
  return frame.body.scrollHeight - layout.margins.top - layout.margins.bottom;
}

const PreviewFrame = memo(({ srcDoc, doc, onFit }: PreviewFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(LETTER_HEIGHT_PX);
  const [layout, setLayout] = useState<Layout>(() => layoutFor(doc, srcDoc));

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.min(1, entry.contentRect.width / LETTER_WIDTH_PX));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(async () => {
    const frame = iframeRef.current?.contentDocument;
    if (!frame?.body) return;
    const next = layoutFor(doc, srcDoc);
    if (next.isPaged) {
      const { top, right, bottom, left } = next.margins;
      Object.assign(frame.body.style, {
        boxSizing: 'border-box',
        width: `${LETTER_WIDTH_PX}px`,
        padding: `${top}px ${right}px ${bottom}px ${left}px`,
      });
    }
    await frame.fonts.ready;
    const result = findFit(doc.fit, doc.pages, next.pageHeightPx, (setting) =>
      applySetting(frame, setting, next)
    );
    // Show the page(s) at the setting the PDF build is expected to use.
    const shown = result.setting ?? doc.fit[doc.fit.length - 1];
    if (shown) applySetting(frame, shown, next);
    setLayout(next);
    setContentHeight(Math.max(LETTER_HEIGHT_PX * doc.pages, frame.body.scrollHeight));
    onFit(result, srcDoc);
  }, [doc, onFit, srcDoc]);

  const handleLoadEvent = useCallback(() => {
    void handleLoad();
  }, [handleLoad]);

  const boundaries = Array.from(
    { length: doc.pages },
    (_, index) => layout.margins.top + layout.pageHeightPx * (index + 1)
  );

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: LETTER_WIDTH_PX * scale, height: contentHeight * scale }}
      >
        <iframe
          ref={iframeRef}
          title="Résumé preview"
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          onLoad={handleLoadEvent}
          className="absolute left-0 top-0 bg-white shadow-md"
          style={{
            width: LETTER_WIDTH_PX,
            height: contentHeight,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
        {boundaries.map((top, index) => (
          <div
            key={top}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-red-500"
            style={{ top: top * scale }}
          >
            <span className="absolute right-0 top-0 bg-red-500 px-1 text-[10px] font-medium text-white">
              {layout.isPaged ? '≈ ' : ''}end of page {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

PreviewFrame.displayName = 'PreviewFrame';

export default PreviewFrame;
