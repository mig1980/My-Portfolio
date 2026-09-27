/**
 * @fileoverview Live résumé preview at Letter size, with the one-page fit check.
 * @description The iframe is sandboxed WITHOUT allow-scripts, so the HTML can never run code.
 * allow-same-origin is required so fonts load and the fit check can measure the page.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FIT_SETTINGS, LETTER_HEIGHT_PX, LETTER_WIDTH_PX, type FitSetting } from '../../resume/pdf';
import { findFit, type FitResult } from '../fit';

interface PreviewFrameProps {
  srcDoc: string;
  /** Called after each load with the result and the exact HTML that was measured. */
  onFit: (result: FitResult, srcDoc: string) => void;
}

const SMALLEST_SETTING = FIT_SETTINGS[FIT_SETTINGS.length - 1];

function applySetting(doc: Document, setting: FitSetting): number {
  doc.documentElement.style.setProperty('--fs', `${setting.fontSizePt}pt`);
  doc.documentElement.style.setProperty('--gap', String(setting.gap));
  return doc.body.scrollHeight;
}

const PreviewFrame = memo(({ srcDoc, onFit }: PreviewFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(LETTER_HEIGHT_PX);

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
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    await doc.fonts.ready;
    const result = findFit((setting) => applySetting(doc, setting));
    // Show the page exactly as the PDF build will print it.
    const shown = result.setting ?? SMALLEST_SETTING;
    const height = shown ? applySetting(doc, shown) : doc.body.scrollHeight;
    setContentHeight(Math.max(LETTER_HEIGHT_PX, height));
    onFit(result, srcDoc);
  }, [onFit, srcDoc]);

  const handleLoadEvent = useCallback(() => {
    void handleLoad();
  }, [handleLoad]);

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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-red-500"
          style={{ top: LETTER_HEIGHT_PX * scale }}
        >
          <span className="absolute right-0 top-0 bg-red-500 px-1 text-[10px] font-medium text-white">
            end of page 1
          </span>
        </div>
      </div>
    </div>
  );
});

PreviewFrame.displayName = 'PreviewFrame';

export default PreviewFrame;
