/**
 * @fileoverview Private résumé editor: HTML on the left, live one-page preview on the right,
 * Publish commits to GitHub and the Resume PDF Action rebuilds /CV/MGavrilovCV.pdf.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { AdminResumeFile } from '../types';
import { renderResume } from '../resume/render';
import { validateResumeHtml } from '../resume/validate';
import { AdminApiError, loadBuildStatus, loadResume, publishResume } from './api';
import type { FitResult } from './fit';
import { useDebouncedValue } from './useDebouncedValue';
import HtmlEditor from './components/HtmlEditor';
import PreviewFrame from './components/PreviewFrame';
import ValidationPanel from './components/ValidationPanel';
import PublishDialog from './components/PublishDialog';
import BuildStatus, { type BuildState } from './components/BuildStatus';

export const DRAFT_KEY = 'resume-admin-draft';
const PREVIEW_DEBOUNCE_MS = 300;
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60_000;
const LIVE_PDF_URL = '/CV/MGavrilovCV.pdf';

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };
type Notice = { tone: 'error' | 'info'; text: string; errors?: string[] };

function readDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function writeDraft(html: string | null): void {
  try {
    if (html === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, html);
  } catch {
    // Storage full or blocked: the draft just isn't kept.
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

const buttonClass =
  'rounded border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 focus-ring';

const FitBadge = memo(({ fit }: { fit: FitResult | null }) => {
  if (!fit) return <span className="text-sm text-stone-500">Checking page fit…</span>;
  if (fit.setting) {
    return (
      <span className="text-sm font-medium text-emerald-700">
        ✓ Fits on one page ({fit.setting.fontSizePt}pt)
      </span>
    );
  }
  return (
    <span className="text-sm font-semibold text-red-700">
      ✗ Too long: cut about {fit.overflowLines} line{fit.overflowLines === 1 ? '' : 's'}
    </span>
  );
});

FitBadge.displayName = 'FitBadge';

const ResumeEditor = () => {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [base, setBase] = useState<AdminResumeFile | null>(null);
  const [html, setHtml] = useState('');
  const [draftOffer, setDraftOffer] = useState<string | null>(null);
  const [fitCheck, setFitCheck] = useState<{ srcDoc: string; result: FitResult } | null>(null);
  const [tab, setTab] = useState<'code' | 'preview'>('code');
  const [lineWrap, setLineWrap] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [build, setBuild] = useState<BuildState>({ phase: 'idle' });
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);

  const debouncedHtml = useDebouncedValue(html, PREVIEW_DEBOUNCE_MS);
  const isChecking = debouncedHtml !== html;
  const validation = useMemo(() => validateResumeHtml(debouncedHtml), [debouncedHtml]);
  const srcDoc = useMemo(
    () => renderResume(debouncedHtml, { variant: 'enterprise' }),
    [debouncedHtml]
  );
  // A fit result only counts for the HTML it was measured on.
  const fit = !isChecking && fitCheck?.srcDoc === srcDoc ? fitCheck.result : null;
  const isDirty = base !== null && html !== base.html;
  const canPublish =
    isDirty && !isChecking && validation.ok && fit?.setting != null && !isPublishing;

  const fetchResume = useCallback(async (offerDraft: boolean) => {
    setLoad({ status: 'loading' });
    try {
      const file = await loadResume();
      setBase(file);
      setHtml(file.html);
      setLoad({ status: 'ready' });
      const saved = offerDraft ? readDraft() : null;
      setDraftOffer(saved !== null && saved !== file.html ? saved : null);
    } catch (error) {
      setLoad({ status: 'error', message: errorText(error) });
    }
  }, []);

  useEffect(() => {
    void fetchResume(true);
  }, [fetchResume]);

  // Autosave unpublished edits, but never overwrite a draft the user hasn't decided on yet.
  useEffect(() => {
    if (!base || draftOffer !== null || isChecking) return;
    writeDraft(debouncedHtml === base.html ? null : debouncedHtml);
  }, [base, debouncedHtml, draftOffer, isChecking]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (build.phase !== 'building') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const status = await loadBuildStatus();
        const run = status.run;
        if (cancelled) return;
        if (run && run.headSha === build.commitSha && run.status === 'completed') {
          setBuild(
            run.conclusion === 'success'
              ? { phase: 'done', pdfUrl: `${LIVE_PDF_URL}?v=${status.pdf?.sha ?? build.commitSha}` }
              : { phase: 'failed', runUrl: run.url }
          );
          return;
        }
      } catch {
        // Temporary errors: keep polling until the timeout.
      }
      if (!cancelled && Date.now() - build.startedAt > POLL_TIMEOUT_MS)
        setBuild({ phase: 'timeout' });
    };
    const id = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [build]);

  const handleRestoreDraft = useCallback(() => {
    if (draftOffer !== null) setHtml(draftOffer);
    setDraftOffer(null);
  }, [draftOffer]);

  const handleDiscardDraft = useCallback(() => {
    writeDraft(null);
    setDraftOffer(null);
  }, []);

  const handleRevert = useCallback(() => {
    if (isDirty && !window.confirm('Discard your unpublished changes and reload from GitHub?'))
      return;
    writeDraft(null);
    setNotice(null);
    void fetchResume(false);
  }, [fetchResume, isDirty]);

  const handleDownload = useCallback(() => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.html';
    link.click();
    URL.revokeObjectURL(url);
  }, [html]);

  const handleJump = useCallback((line: number) => {
    setTab('code');
    const view = editorRef.current?.view;
    if (!view) return;
    const target = view.state.doc.line(Math.min(Math.max(line, 1), view.state.doc.lines));
    view.dispatch({ selection: { anchor: target.from }, scrollIntoView: true });
    view.focus();
  }, []);

  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), []);
  const handleRetry = useCallback(() => void fetchResume(true), [fetchResume]);
  const handleFit = useCallback(
    (result: FitResult, measured: string) => setFitCheck({ srcDoc: measured, result }),
    []
  );
  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);
  const handleToggleWrap = useCallback(() => setLineWrap((value) => !value), []);
  const handleShowCode = useCallback(() => setTab('code'), []);
  const handleShowPreview = useCallback(() => setTab('preview'), []);

  const handlePublish = useCallback(
    async (message: string) => {
      if (!base) return;
      setIsPublishing(true);
      setNotice(null);
      try {
        const result = await publishResume(html, base.sha, message);
        setBase({ html, sha: result.sha });
        writeDraft(null);
        setIsDialogOpen(false);
        setBuild({ phase: 'building', commitSha: result.commitSha, startedAt: Date.now() });
      } catch (error) {
        setIsDialogOpen(false);
        if (error instanceof AdminApiError && error.status === 409) {
          setNotice({
            tone: 'error',
            text: 'The résumé was changed somewhere else since you opened it. Download your HTML to keep your edits, then click Revert to load the latest version.',
          });
        } else if (error instanceof AdminApiError && error.status === 422) {
          setNotice({ tone: 'error', text: error.message, errors: error.errors });
        } else {
          setNotice({ tone: 'error', text: `Publishing failed: ${errorText(error)}` });
        }
      } finally {
        setIsPublishing(false);
      }
    },
    [base, html]
  );

  const handleConfirmPublish = useCallback(
    (message: string) => {
      void handlePublish(message);
    },
    [handlePublish]
  );

  if (load.status === 'loading' && !base) {
    return <p className="p-8 text-stone-600">Loading résumé…</p>;
  }
  if (load.status === 'error' && !base) {
    return (
      <div className="p-8">
        <p role="alert" className="text-red-700">
          Could not load the résumé: {load.message}
        </p>
        <button type="button" onClick={handleRetry} className={`${buttonClass} mt-4`}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-2">
        <h1 className="font-display text-2xl">Résumé editor</h1>
        <FitBadge fit={fit} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <a
            href={LIVE_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 text-sm text-primary-700 underline underline-offset-2 focus-ring"
          >
            Live PDF
          </a>
          <button type="button" onClick={handleRevert} className={buttonClass}>
            Revert
          </button>
          <button type="button" onClick={handleDownload} className={buttonClass}>
            Download HTML
          </button>
          <button
            type="button"
            onClick={handleOpenDialog}
            disabled={!canPublish}
            className="rounded bg-primary-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
          >
            Publish
          </button>
        </div>
      </header>

      {(draftOffer !== null || notice || build.phase !== 'idle') && (
        <div className="space-y-2 border-b border-stone-200 bg-white px-4 py-2">
          {draftOffer !== null && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>You have unpublished changes from last time.</span>
              <button type="button" onClick={handleRestoreDraft} className={buttonClass}>
                Restore them
              </button>
              <button type="button" onClick={handleDiscardDraft} className={buttonClass}>
                Discard
              </button>
            </div>
          )}
          {notice && (
            <div role={notice.tone === 'error' ? 'alert' : 'status'} className="text-sm">
              <p className={notice.tone === 'error' ? 'text-red-800' : 'text-primary-800'}>
                {notice.text}
              </p>
              {notice.errors && notice.errors.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-red-800">
                  {notice.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <BuildStatus build={build} />
        </div>
      )}

      <div className="flex border-b border-stone-200 bg-white md:hidden" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'code'}
          onClick={handleShowCode}
          className={`flex-1 py-2 text-sm ${tab === 'code' ? 'font-semibold text-primary-700' : ''}`}
        >
          Code
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'preview'}
          onClick={handleShowPreview}
          className={`flex-1 py-2 text-sm ${tab === 'preview' ? 'font-semibold text-primary-700' : ''}`}
        >
          Preview
        </button>
      </div>

      <main className="grid min-h-0 flex-1 md:grid-cols-2">
        <section
          aria-label="Code"
          className={`min-h-0 flex-col border-stone-200 md:flex md:border-r ${tab === 'code' ? 'flex' : 'hidden'}`}
        >
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-3 py-1 text-xs">
            <span className="text-stone-500">Ctrl+F to find and replace</span>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={lineWrap} onChange={handleToggleWrap} />
              Wrap lines
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden bg-white">
            <HtmlEditor value={html} onChange={setHtml} lineWrap={lineWrap} editorRef={editorRef} />
          </div>
          <div className="border-t border-stone-200 bg-white">
            <ValidationPanel
              errors={validation.errors}
              isChecking={isChecking}
              onJump={handleJump}
            />
          </div>
        </section>
        <section
          aria-label="Preview"
          className={`min-h-0 overflow-auto bg-stone-200 p-4 md:block ${tab === 'preview' ? 'block' : 'hidden'}`}
        >
          <PreviewFrame srcDoc={srcDoc} onFit={handleFit} />
        </section>
      </main>

      {isDialogOpen && base && (
        <PublishDialog
          before={base.html}
          after={html}
          isBusy={isPublishing}
          onConfirm={handleConfirmPublish}
          onCancel={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default ResumeEditor;
