/**
 * @fileoverview State for the "Check my fit" dialog: sends the job description to /api/fit.
 * The job description stays in memory only; it's never stored or sent to analytics.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '../utils/analytics';
import type { FitCheckError, FitCheckResult } from '../types';

export type FitCheckStatus = 'idle' | 'loading' | 'success' | 'error' | 'rate_limited';

export interface UseFitCheckReturn {
  status: FitCheckStatus;
  result: FitCheckResult | null;
  error: string | null;
  /** Seconds until another check is allowed (0 when not rate limited) */
  cooldownSeconds: number;
  submit: (jobDescription: string) => void;
  reset: () => void;
}

const ENDPOINT = '/api/fit';
/** Above the server's 55s budget in functions/api/fit.ts */
const CLIENT_TIMEOUT_MS = 65000;
const DEFAULT_COOLDOWN_MS = 30000;

const MESSAGES = {
  timeout: 'The analysis took too long. Please try again.',
  offline: "You're offline. Check your connection and try again.",
  unusable: "Couldn't produce a reliable analysis for this description. Please try again.",
  notAJobDescription:
    "This doesn't look like a job description. Paste the role's responsibilities and requirements.",
  unavailable: 'The fit check is unavailable right now. Please try again later.',
} as const;

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isPointList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).point === 'string' &&
        typeof (item as Record<string, unknown>).evidence === 'string'
    )
  );
}

function isFitCheckResult(value: unknown): value is FitCheckResult {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    isPointList(data.fits) &&
    isPointList(data.transferable) &&
    isStringList(data.gaps) &&
    isStringList(data.questions)
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export function useFitCheck(): UseFitCheckReturn {
  const [status, setStatus] = useState<FitCheckStatus>('idle');
  const [result, setResult] = useState<FitCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const controllerRef = useRef<AbortController | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCooldown = useCallback((): void => {
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownTimeoutRef.current = null;
    cooldownIntervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      stopCooldown();
    };
  }, [stopCooldown]);

  const startCooldown = useCallback(
    (retryAfterMs: unknown): void => {
      const ms =
        typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs) && retryAfterMs > 0
          ? retryAfterMs
          : DEFAULT_COOLDOWN_MS;
      const seconds = Math.max(1, Math.ceil(ms / 1000));
      stopCooldown();
      setCooldownSeconds(seconds);
      setStatus('rate_limited');
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownSeconds((remaining) => Math.max(0, remaining - 1));
      }, 1000);
      cooldownTimeoutRef.current = setTimeout(() => {
        stopCooldown();
        setCooldownSeconds(0);
        setStatus('idle');
      }, seconds * 1000);
    },
    [stopCooldown]
  );

  const submit = useCallback(
    (jobDescription: string): void => {
      if (controllerRef.current || cooldownTimeoutRef.current) return;

      trackEvent('fit_check_run');
      setStatus('loading');
      setError(null);
      setResult(null);

      const controller = new AbortController();
      controllerRef.current = controller;
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, CLIENT_TIMEOUT_MS);

      const fail = (message: string): void => {
        setError(message);
        setStatus('error');
      };

      void (async () => {
        try {
          const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobDescription }),
            signal: controller.signal,
          });
          const data = await readJson(response);

          if (response.ok && isFitCheckResult(data)) {
            setResult(data);
            setStatus('success');
          } else if (response.status === 429) {
            startCooldown((data as FitCheckError | null)?.retryAfterMs);
          } else if (response.status === 422) {
            fail(
              (data as FitCheckError | null)?.code === 'not_a_job_description'
                ? MESSAGES.notAJobDescription
                : MESSAGES.unusable
            );
          } else if (
            response.status === 400 &&
            typeof (data as FitCheckError | null)?.error === 'string'
          ) {
            fail((data as FitCheckError).error);
          } else {
            fail(MESSAGES.unavailable);
          }
        } catch {
          if (controller.signal.aborted && !timedOut) return;
          fail(
            timedOut ? MESSAGES.timeout : navigator.onLine ? MESSAGES.unavailable : MESSAGES.offline
          );
        } finally {
          clearTimeout(timeoutId);
          if (controllerRef.current === controller) controllerRef.current = null;
        }
      })();
    },
    [startCooldown]
  );

  const reset = useCallback((): void => {
    setResult(null);
    setError(null);
    setStatus((current) => (current === 'rate_limited' ? current : 'idle'));
  }, []);

  return { status, result, error, cooldownSeconds, submit, reset };
}
