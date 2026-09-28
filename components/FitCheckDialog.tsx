/**
 * @fileoverview "Check my fit" dialog: paste a job description, get an analysis grounded in the résumé.
 * Loaded on demand from the Hero, so none of it ships in the first page load.
 */

import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Download, Loader2, Mail, X } from 'lucide-react';
import { PERSONAL_INFO } from '../constants';
import { useFitCheck } from '../hooks/useFitCheck';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { trackEvent } from '../utils/analytics';
import { MAX_JOB_DESCRIPTION_LENGTH, MIN_JOB_DESCRIPTION_LENGTH } from '../utils/fitCheckLimits';
import { restatesEvidence } from '../utils/fitCheck';
import type { FitCheckPoint } from '../types';

interface FitCheckDialogProps {
  onClose: () => void;
}

const SECTION_TITLE_CLASS = 'font-mono text-xs uppercase tracking-[0.2em] text-stone-600';
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-stone-400 hover:border-ink text-ink rounded-full text-sm font-semibold transition-colors focus-ring';
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-ink text-paper hover:bg-stone-800 rounded-full text-sm font-semibold transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed';

const PointSection = memo(({ title, items }: { title: string; items: FitCheckPoint[] }) => {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
      <ul className="mt-3 space-y-4">
        {items.map((item, index) => (
          <li key={index}>
            <p className="text-sm text-ink leading-relaxed">{item.point}</p>
            {!restatesEvidence(item.point, item.evidence) && (
              <q className="mt-1.5 block border-l-2 border-primary-200 pl-3 text-xs italic text-stone-600 leading-relaxed">
                {item.evidence}
              </q>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
});

PointSection.displayName = 'PointSection';

const TextSection = memo(({ title, items }: { title: string; items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink leading-relaxed">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
});

TextSection.displayName = 'TextSection';

const FitCheckDialog: React.FC<FitCheckDialogProps> = memo(({ onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const { status, result, error, cooldownSeconds, submit, reset } = useFitCheck();
  const titleId = useId();
  const fieldId = useId();
  const helpId = useId();
  const countId = useId();

  useBodyScrollLock(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (status === 'success') resultsRef.current?.focus();
  }, [status]);

  const isLoading = status === 'loading';
  const isRateLimited = status === 'rate_limited';
  const trimmedLength = jobDescription.trim().length;
  const canSubmit = trimmedLength >= MIN_JOB_DESCRIPTION_LENGTH && !isLoading && !isRateLimited;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setJobDescription(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      if (canSubmit) submit(jobDescription);
    },
    [canSubmit, jobDescription, submit]
  );

  const handleCloseClick = useCallback((): void => {
    dialogRef.current?.close();
  }, []);

  const handleDownloadClick = useCallback((): void => {
    trackEvent('fit_check_cta', { action: 'download_resume' });
  }, []);

  const handleContactClick = useCallback((): void => {
    trackEvent('fit_check_cta', { action: 'contact' });
    dialogRef.current?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] p-0 rounded-lg bg-white text-ink shadow-xl backdrop:bg-ink/50 open:flex open:flex-col max-sm:w-full max-sm:max-w-none max-sm:h-full max-sm:max-h-none max-sm:rounded-none"
    >
      <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            Check Michael&apos;s fit for your role
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Paste a job description. The analysis uses only Michael&apos;s résumé.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Close"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-600 hover:text-ink hover:bg-stone-100 transition-colors focus-ring"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {status === 'success' && result ? (
        <>
          <div
            ref={resultsRef}
            tabIndex={-1}
            aria-label="Fit analysis"
            className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-7 focus:outline-none"
          >
            <PointSection title="Where Michael fits" items={result.fits} />
            <PointSection title="Transferable experience" items={result.transferable} />
            <TextSection title="Gaps to discuss" items={result.gaps} />
            <TextSection title="Questions to explore" items={result.questions} />
          </div>
          <div className="border-t border-stone-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={reset} className={SECONDARY_BUTTON_CLASS}>
                Check another role
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={PERSONAL_INFO.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownloadClick}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download résumé
                </a>
                <a href="#contact" onClick={handleContactClick} className={PRIMARY_BUTTON_CLASS}>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Contact
                </a>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-600">
              AI-generated from Michael&apos;s résumé. Please verify details with him.
            </p>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
              Job description
            </label>
            <textarea
              id={fieldId}
              value={jobDescription}
              onChange={handleChange}
              maxLength={MAX_JOB_DESCRIPTION_LENGTH}
              rows={12}
              disabled={isLoading}
              aria-describedby={`${helpId} ${countId}`}
              placeholder="Paste the role's responsibilities and requirements…"
              className="mt-2 w-full resize-y rounded-md border border-stone-300 bg-white p-3 text-sm text-ink placeholder:text-stone-500 focus:border-primary-700 focus-ring disabled:bg-stone-50"
            />
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p id={helpId} className="text-xs text-stone-600">
                Sent to Google Gemini to generate the analysis and not stored by this site. Google
                may use it to improve its services, so don&apos;t paste confidential information.
              </p>
              <p id={countId} className="shrink-0 text-xs tabular-nums text-stone-600">
                {jobDescription.length.toLocaleString('en-US')} /{' '}
                {MAX_JOB_DESCRIPTION_LENGTH.toLocaleString('en-US')}
                {trimmedLength < MIN_JOB_DESCRIPTION_LENGTH &&
                  ` · at least ${MIN_JOB_DESCRIPTION_LENGTH}`}
              </p>
            </div>

            {status === 'error' && error && (
              <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-900">
                {error}
              </p>
            )}
            {isRateLimited && (
              <p
                role="status"
                className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                Too many requests. Try again in {cooldownSeconds}s.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 px-5 py-4 sm:px-6">
            {isLoading && (
              <p role="status" className="text-sm text-stone-600">
                Analyzing… this can take up to a minute.
              </p>
            )}
            <button type="submit" disabled={!canSubmit} className={PRIMARY_BUTTON_CLASS}>
              {isLoading && (
                <Loader2
                  className="w-4 h-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              Check fit
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
});

FitCheckDialog.displayName = 'FitCheckDialog';

export default FitCheckDialog;
