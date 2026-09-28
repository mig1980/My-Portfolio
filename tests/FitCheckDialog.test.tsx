/**
 * @fileoverview Tests for the "Check my fit" dialog (fetch mocked).
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import FitCheckDialog from '../components/FitCheckDialog';
import { trackEvent } from '../utils/analytics';
import { PERSONAL_INFO } from '../constants';
import type { FitCheckResult } from '../types';

vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));

const mockFetch = vi.fn() as Mock;
const JOB = `Strategic Account Director role. ${'Own executive relationships and account strategy. '.repeat(5)}`;

const RESULT: FitCheckResult = {
  fits: [
    {
      point: 'Has structured large strategic agreements.',
      evidence: 'Structured and negotiated strategic agreements exceeding $500M',
    },
  ],
  transferable: [],
  gaps: ['No Kubernetes experience listed.'],
  questions: ['Which regions has Michael covered?'],
};

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

function renderDialog(): { onClose: Mock } {
  const onClose = vi.fn();
  render(<FitCheckDialog onClose={onClose} />);
  return { onClose };
}

function typeJob(text = JOB): void {
  fireEvent.change(screen.getByLabelText('Job description'), { target: { value: text } });
}

describe('FitCheckDialog', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens as a labelled dialog with a character counter', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: /check michael's fit/i })).toBeInTheDocument();
    expect(screen.getByText('0 / 8,000 · at least 200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check fit' })).toBeDisabled();
  });

  it('enables Submit from 200 characters', () => {
    renderDialog();

    typeJob('x'.repeat(199));
    expect(screen.getByRole('button', { name: 'Check fit' })).toBeDisabled();

    typeJob('x'.repeat(200));
    expect(screen.getByText('200 / 8,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check fit' })).toBeEnabled();
  });

  it('submits the job description and renders the four sections with evidence', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(RESULT));
    renderDialog();

    typeJob();
    fireEvent.click(screen.getByRole('button', { name: 'Check fit' }));

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    expect(await screen.findByText('Where Michael fits')).toBeInTheDocument();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/fit');
    expect(JSON.parse(String(init.body))).toEqual({ jobDescription: JOB });

    expect(screen.getByText('Has structured large strategic agreements.')).toBeInTheDocument();
    expect(
      screen.getByText('Structured and negotiated strategic agreements exceeding $500M').tagName
    ).toBe('Q');
    expect(screen.queryByText('Transferable experience')).not.toBeInTheDocument();
    expect(screen.getByText('Gaps to discuss')).toBeInTheDocument();
    expect(screen.getByText('Questions to explore')).toBeInTheDocument();
    expect(
      screen.getByText("AI-generated from Michael's résumé. Please verify details with him.")
    ).toBeInTheDocument();

    const download = screen.getByRole('link', { name: /download résumé/i });
    expect(download).toHaveAttribute('href', PERSONAL_INFO.resumeUrl);
    expect(download).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '#contact');
  });

  it('tracks runs and CTAs without sending the job description', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(RESULT));
    const { onClose } = renderDialog();

    typeJob();
    fireEvent.click(screen.getByRole('button', { name: 'Check fit' }));
    fireEvent.click(await screen.findByRole('link', { name: /download résumé/i }));
    fireEvent.click(screen.getByRole('link', { name: /contact/i }));

    expect(vi.mocked(trackEvent).mock.calls).toEqual([
      ['fit_check_run'],
      ['fit_check_cta', { action: 'download_resume' }],
      ['fit_check_cta', { action: 'contact' }],
    ]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('goes back to the form, keeping the text, with "Check another role"', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(RESULT));
    renderDialog();

    typeJob();
    fireEvent.click(screen.getByRole('button', { name: 'Check fit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Check another role' }));

    expect(screen.getByLabelText('Job description')).toHaveValue(JOB);
  });

  it('shows an error when the analysis is unusable', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'unusable' }, 422));
    renderDialog();

    typeJob();
    fireEvent.click(screen.getByRole('button', { name: 'Check fit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn't produce a reliable analysis/i
    );
    expect(screen.getByRole('button', { name: 'Check fit' })).toBeEnabled();
  });

  it('shows a countdown and disables Submit when rate limited', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Too many', retryAfterMs: 12000 }, 429));
    renderDialog();

    typeJob();
    fireEvent.click(screen.getByRole('button', { name: 'Check fit' }));

    expect(await screen.findByText('Too many requests. Try again in 12s.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check fit' })).toBeDisabled();
  });

  it('closes from the close button', async () => {
    const { onClose } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
