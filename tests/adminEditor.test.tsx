/**
 * @fileoverview Tests for the résumé editor page: loading, validation, drafts and publishing.
 * CodeMirror and the preview iframe need real layout, so they are replaced with simple stand-ins.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useEffect } from 'react';

vi.mock('../admin/components/HtmlEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Résumé HTML" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const fitState = vi.hoisted(() => ({ fits: true }));

vi.mock('../admin/components/PreviewFrame', () => ({
  default: function PreviewStub({
    srcDoc,
    onFit,
  }: {
    srcDoc: string;
    onFit: (result: unknown, srcDoc: string) => void;
  }) {
    useEffect(() => {
      onFit(
        fitState.fits
          ? { setting: { fontSizePt: 9.4, gap: 0.7 }, pages: 1, target: 1, overflowLines: 0 }
          : { setting: null, pages: 2, target: 1, overflowLines: 4 },
        srcDoc
      );
    }, [srcDoc, onFit]);
    return <div data-testid="preview" />;
  },
}));

import ResumeEditor, { draftKey } from '../admin/ResumeEditor';
import AdminApp from '../admin/AdminApp';

const DRAFT_KEY = draftKey('executive');
const noop = (): void => {};

const template = readFileSync(resolve(process.cwd(), 'content', 'resume.html'), 'utf8');
const SHA = 'a'.repeat(40);
const mockFetch = vi.fn() as Mock;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function editor(): HTMLTextAreaElement {
  return screen.getByLabelText('Résumé HTML') as HTMLTextAreaElement;
}

function publishButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement;
}

async function renderLoaded(): Promise<void> {
  render(<ResumeEditor docId="executive" onSwitchDoc={noop} />);
  await waitFor(() => expect(editor().value).toBe(template));
}

async function editAndOpenDialog(html: string): Promise<void> {
  fireEvent.change(editor(), { target: { value: html } });
  await waitFor(() => expect(publishButton().disabled).toBe(false));
  fireEvent.click(publishButton());
  await screen.findByRole('dialog');
}

describe('ResumeEditor', () => {
  beforeEach(() => {
    fitState.fits = true;
    localStorage.clear();
    mockFetch.mockReset();
    mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === 'PUT'
          ? jsonResponse({ sha: 'b'.repeat(40), commitSha: 'c'.repeat(40), commitUrl: 'u' })
          : jsonResponse({ html: template, sha: SHA })
      )
    );
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the résumé and keeps Publish disabled until something changes', async () => {
    await renderLoaded();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/resume?doc=executive', expect.anything());
    expect(await screen.findByText(/Fits on one page \(9\.4pt\)/)).toBeInTheDocument();
    expect(publishButton().disabled).toBe(true);
  });

  it('shows validation problems and blocks publishing', async () => {
    await renderLoaded();
    fireEvent.change(editor(), {
      target: { value: template.replace('</body>', '<script>x</script></body>') },
    });
    expect(await screen.findByText(/Remove the <script> tag/)).toBeInTheDocument();
    expect(publishButton().disabled).toBe(true);
  });

  it('blocks publishing when the résumé does not fit on one page', async () => {
    fitState.fits = false;
    await renderLoaded();
    fireEvent.change(editor(), {
      target: { value: template.replace('Executive Summary', 'Summary') },
    });
    expect(await screen.findByText(/Too long for 1 page: cut about 4 lines/)).toBeInTheDocument();
    expect(publishButton().disabled).toBe(true);
  });

  it('publishes with the note and starts tracking the PDF build', async () => {
    await renderLoaded();
    const edited = template.replace('Executive Summary', 'Summary');
    await editAndOpenDialog(edited);
    expect(screen.getByText(/1 line added, 1 removed/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/What changed/), {
      target: { value: 'shorter heading' },
    });
    fireEvent.submit(screen.getByRole('dialog'));

    expect(await screen.findByText(/Building the PDF/)).toBeInTheDocument();
    const put = mockFetch.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT');
    expect(JSON.parse(String((put?.[1] as RequestInit).body))).toEqual({
      html: edited,
      sha: SHA,
      message: 'shorter heading',
    });
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(publishButton().disabled).toBe(true);
  });

  it('warns about a changed shared fact but still allows publishing', async () => {
    await renderLoaded();
    await editAndOpenDialog(template.replace('Gold Club (3×)', 'Gold Club (4×)'));
    expect(screen.getAllByText(/Gold Club should show 3×/)).toHaveLength(2);
    expect(screen.getByRole('dialog')).toHaveTextContent(/You can still publish/);
  });

  it('makes the page inert behind the dialog and returns focus to Publish', async () => {
    await renderLoaded();
    await editAndOpenDialog(template.replace('Executive Summary', 'Summary'));
    expect(screen.getByRole('button', { name: 'Revert' }).closest('[inert]')).not.toBeNull();
    expect(screen.getByLabelText(/What changed/)).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(publishButton()).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Revert' }).closest('[inert]')).toBeNull();
  });

  it('explains a conflict when the file changed elsewhere (409)', async () => {
    await renderLoaded();
    mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === 'PUT'
          ? jsonResponse({ error: 'changed' }, 409)
          : jsonResponse({ html: template, sha: SHA })
      )
    );
    await editAndOpenDialog(template.replace('Executive Summary', 'Summary'));
    fireEvent.submit(screen.getByRole('dialog'));
    expect(await screen.findByText(/changed somewhere else/)).toBeInTheDocument();
    expect(screen.queryByText(/Building the PDF/)).not.toBeInTheDocument();
  });

  it('lists server validation errors (422)', async () => {
    await renderLoaded();
    mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === 'PUT'
          ? jsonResponse({ error: 'The résumé has problems', errors: ['Line 3: bad thing'] }, 422)
          : jsonResponse({ html: template, sha: SHA })
      )
    );
    await editAndOpenDialog(template.replace('Executive Summary', 'Summary'));
    fireEvent.submit(screen.getByRole('dialog'));
    expect(await screen.findByText('The résumé has problems')).toBeInTheDocument();
    expect(screen.getByText('Line 3: bad thing')).toBeInTheDocument();
  });

  it('offers to restore an unpublished draft', async () => {
    const draft = template.replace('Executive Summary', 'Draft heading');
    localStorage.setItem(DRAFT_KEY, draft);
    await renderLoaded();
    fireEvent.click(await screen.findByRole('button', { name: 'Restore them' }));
    expect(editor().value).toBe(draft);
  });

  it('shows an error when the résumé cannot be loaded', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Not signed in' }, 401));
    render(<ResumeEditor docId="executive" onSwitchDoc={noop} />);
    expect(await screen.findByText(/Could not load the résumé: Not signed in/)).toBeInTheDocument();
  });

  it('treats a web page instead of data (e.g. sign-in screen) as an error', async () => {
    mockFetch.mockResolvedValue(new Response('<!doctype html><p>Sign in</p>', { status: 200 }));
    render(<ResumeEditor docId="executive" onSwitchDoc={noop} />);
    expect(await screen.findByText(/Unexpected response from the server/)).toBeInTheDocument();
  });

  it('switches to the ATS document and keeps unpublished executive edits as a draft', async () => {
    window.history.replaceState(null, '', '/admin/');
    render(<AdminApp />);
    await waitFor(() => expect(editor().value).toBe(template));
    const edited = template.replace('Executive Summary', 'Summary');
    fireEvent.change(editor(), { target: { value: edited } });

    fireEvent.click(screen.getByRole('button', { name: 'ATS (2 p.)' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/resume?doc=ats', expect.anything())
    );
    expect(window.location.search).toBe('?doc=ats');
    expect(localStorage.getItem(DRAFT_KEY)).toBe(edited);
    expect(screen.getByRole('button', { name: 'ATS (2 p.)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
