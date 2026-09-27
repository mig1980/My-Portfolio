/**
 * @fileoverview Unit tests for the GitHub-backed admin API (/api/admin/resume and /api/admin/status).
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { onRequest as resumeHandler } from '../functions/api/admin/resume';
import { onRequest as statusHandler } from '../functions/api/admin/status';
import { decodeBase64Utf8, encodeBase64Utf8 } from '../resume/github';

type Context = Parameters<typeof resumeHandler>[0];

const ORIGIN = 'https://gavrilov.ai';
const ENV = { GITHUB_TOKEN: 'test-token', GITHUB_REPO: 'mig1980/My-Portfolio' };
const SHA = 'a'.repeat(40);
const CONTENTS_URL =
  'https://api.github.com/repos/mig1980/My-Portfolio/contents/content/resume.html';
const template = readFileSync(resolve(process.cwd(), 'content', 'resume.html'), 'utf8');
const atsTemplate = readFileSync(resolve(process.cwd(), 'content', 'resume-ats.html'), 'utf8');

const mockFetch = vi.fn() as Mock;

function context(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  env: Record<string, string> = ENV
): Context {
  return {
    request: new Request(`${ORIGIN}${path}`, init),
    env,
    data: {},
  } as unknown as Context;
}

function putContext(
  body: unknown,
  headers: Record<string, string> = {},
  path = '/api/admin/resume'
): Context {
  return context(path, {
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function githubJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function sentBody(): Record<string, unknown> {
  const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

describe('base64 helpers', () => {
  it('round-trips non-ASCII text', () => {
    const text = 'Résumé — 5× · “quotes”';
    expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text);
  });

  it('ignores the line breaks GitHub puts in base64 content', () => {
    const wrapped = encodeBase64Utf8('hello world').replace(/(.{4})/g, '$1\n');
    expect(decodeBase64Utf8(wrapped)).toBe('hello world');
  });
});

describe('/api/admin/resume', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    it('returns the decoded HTML and its sha', async () => {
      mockFetch.mockResolvedValue(
        githubJson({ content: encodeBase64Utf8(template), sha: SHA, encoding: 'base64' })
      );
      const response = await resumeHandler(context('/api/admin/resume'));
      expect(response.status).toBe(200);
      expect(await readJson(response)).toEqual({ html: template, sha: SHA });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${CONTENTS_URL}?ref=main`);
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    });

    it('returns 502 when GitHub fails', async () => {
      mockFetch.mockResolvedValue(githubJson({ message: 'Not Found' }, 404));
      expect((await resumeHandler(context('/api/admin/resume'))).status).toBe(502);
    });

    it('returns 502 when GitHub is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('network down'));
      expect((await resumeHandler(context('/api/admin/resume'))).status).toBe(502);
    });

    it('returns 502 for an unexpected GitHub payload', async () => {
      mockFetch.mockResolvedValue(githubJson({ sha: SHA }));
      expect((await resumeHandler(context('/api/admin/resume'))).status).toBe(502);
    });
  });

  describe('PUT', () => {
    it('commits the normalized HTML to main with a commitlint-friendly message', async () => {
      mockFetch.mockResolvedValue(
        githubJson({
          content: { sha: 'b'.repeat(40) },
          commit: { sha: 'c'.repeat(40), html_url: 'https://github.com/x' },
        })
      );
      const html = template.replace(/\n/g, '\r\n');
      const response = await resumeHandler(
        putContext({ html, sha: SHA, message: 'Updated   summary\nline two' })
      );

      expect(response.status).toBe(200);
      expect(await readJson(response)).toEqual({
        sha: 'b'.repeat(40),
        commitSha: 'c'.repeat(40),
        commitUrl: 'https://github.com/x',
      });
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(CONTENTS_URL);
      expect(init.method).toBe('PUT');
      const body = sentBody();
      expect(body.message).toBe('docs(resume): updated summary line two');
      expect(body.sha).toBe(SHA);
      expect(body.branch).toBe('main');
      expect(decodeBase64Utf8(String(body.content))).toBe(template);
    });

    it('uses a default commit message', async () => {
      mockFetch.mockResolvedValue(githubJson({ content: {}, commit: {} }));
      await resumeHandler(putContext({ html: template, sha: SHA }));
      expect(sentBody().message).toBe('docs(resume): update via admin');
    });

    it('returns 422 with the validation errors and does not commit', async () => {
      const html = template.replace('</body>', '<script>x</script></body>');
      const response = await resumeHandler(putContext({ html, sha: SHA }));
      expect(response.status).toBe(422);
      const body = await readJson(response);
      expect(body.errors).toEqual(expect.arrayContaining([expect.stringContaining('<script>')]));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('passes a stale-sha conflict through as 409', async () => {
      mockFetch.mockResolvedValue(githubJson({ message: 'does not match' }, 409));
      const response = await resumeHandler(putContext({ html: template, sha: SHA }));
      expect(response.status).toBe(409);
      expect(String((await readJson(response)).error)).toContain('Reload');
    });

    it('returns 502 for other GitHub errors', async () => {
      mockFetch.mockResolvedValue(githubJson({ message: 'Bad credentials' }, 401));
      expect((await resumeHandler(putContext({ html: template, sha: SHA }))).status).toBe(502);
    });

    it.each([
      ['a missing Origin', { Origin: '' }],
      ['another Origin', { Origin: 'https://evil.example' }],
    ])('returns 403 for %s', async (_label, headers) => {
      const response = await resumeHandler(putContext({ html: template, sha: SHA }, headers));
      expect(response.status).toBe(403);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 415 without a JSON content type', async () => {
      const response = await resumeHandler(
        putContext({ html: template, sha: SHA }, { 'Content-Type': 'text/plain' })
      );
      expect(response.status).toBe(415);
    });

    it('returns 413 for bodies over 128 KB', async () => {
      const response = await resumeHandler(putContext({ html: 'a'.repeat(130 * 1024), sha: SHA }));
      expect(response.status).toBe(413);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each([
      ['invalid JSON', '{not json'],
      ['a missing sha', { html: template }],
      ['a malformed sha', { html: template, sha: 'abc' }],
      ['a non-string html', { html: 42, sha: SHA }],
      ['a non-string message', { html: template, sha: SHA, message: 5 }],
    ])('returns 400 for %s', async (_label, body) => {
      expect((await resumeHandler(putContext(body))).status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('returns 405 for other methods', async () => {
    const response = await resumeHandler(context('/api/admin/resume', { method: 'DELETE' }));
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, PUT');
  });

  it.each([
    ['a missing token', { GITHUB_REPO: ENV.GITHUB_REPO }],
    ['an invalid repo', { ...ENV, GITHUB_REPO: 'not a repo' }],
  ])('fails closed with 500 for %s', async (_label, env) => {
    const response = await resumeHandler(context('/api/admin/resume', {}, env));
    expect(response.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  describe('?doc selection', () => {
    it('reads the ATS source for ?doc=ats', async () => {
      mockFetch.mockResolvedValue(
        githubJson({ content: encodeBase64Utf8(atsTemplate), sha: SHA, encoding: 'base64' })
      );
      const response = await resumeHandler(context('/api/admin/resume?doc=ats'));
      expect(response.status).toBe(200);
      expect(String(mockFetch.mock.calls[0]?.[0])).toBe(
        'https://api.github.com/repos/mig1980/My-Portfolio/contents/content/resume-ats.html?ref=main'
      );
    });

    it('commits the ATS file with its own scope and print margins allowed', async () => {
      mockFetch.mockResolvedValue(githubJson({ content: {}, commit: {} }));
      const response = await resumeHandler(
        putContext({ html: atsTemplate, sha: SHA }, {}, '/api/admin/resume?doc=ats')
      );
      expect(response.status).toBe(200);
      expect(String(mockFetch.mock.calls[0]?.[0])).toMatch(/contents\/content\/resume-ats\.html$/);
      expect(sentBody().message).toBe('docs(resume-ats): update via admin');
    });

    it('keeps the zero-margin rule for the executive document', async () => {
      const response = await resumeHandler(putContext({ html: atsTemplate, sha: SHA }));
      expect(response.status).toBe(422);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each(['../secret', 'content/resume.html', '__proto__', 'EXECUTIVE'])(
      'rejects ?doc=%s without calling GitHub',
      async (doc) => {
        const path = `/api/admin/resume?doc=${encodeURIComponent(doc)}`;
        expect((await resumeHandler(context(path))).status).toBe(400);
        expect(
          (await resumeHandler(putContext({ html: template, sha: SHA }, {}, path))).status
        ).toBe(400);
        expect(mockFetch).not.toHaveBeenCalled();
      }
    );
  });
});

describe('/api/admin/status', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function respond(runs: Response, commits: Response): void {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(url.includes('/actions/') ? runs : commits)
    );
  }

  it('returns the latest run and PDF commit', async () => {
    respond(
      githubJson({
        workflow_runs: [
          {
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://github.com/run/1',
            updated_at: '2026-09-27T12:00:00Z',
            head_sha: SHA,
          },
        ],
      }),
      githubJson([
        {
          sha: 'd'.repeat(40),
          html_url: 'https://github.com/commit/d',
          commit: { committer: { date: '2026-09-27T12:01:00Z' } },
        },
      ])
    );
    const response = await statusHandler(context('/api/admin/status'));
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      run: {
        status: 'completed',
        conclusion: 'success',
        url: 'https://github.com/run/1',
        updatedAt: '2026-09-27T12:00:00Z',
        headSha: SHA,
      },
      pdf: {
        sha: 'd'.repeat(40),
        url: 'https://github.com/commit/d',
        date: '2026-09-27T12:01:00Z',
      },
    });
    const urls = mockFetch.mock.calls.map(([url]) => String(url));
    expect(urls).toContain(
      'https://api.github.com/repos/mig1980/My-Portfolio/actions/workflows/resume-pdf.yml/runs?branch=main&per_page=1'
    );
    expect(urls).toContain(
      'https://api.github.com/repos/mig1980/My-Portfolio/commits?path=public%2FCV%2FMGavrilovCV.pdf&sha=main&per_page=1'
    );
  });

  it('reports no run when the workflow is not on main yet', async () => {
    respond(githubJson({ message: 'Not Found' }, 404), githubJson([]));
    const response = await statusHandler(context('/api/admin/status'));
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ run: null, pdf: null });
  });

  it('returns 502 when GitHub fails', async () => {
    respond(githubJson({}, 500), githubJson([]));
    expect((await statusHandler(context('/api/admin/status'))).status).toBe(502);
  });

  it('returns 405 for other methods', async () => {
    const response = await statusHandler(context('/api/admin/status', { method: 'POST' }));
    expect(response.status).toBe(405);
  });

  it('fails closed with 500 without configuration', async () => {
    const response = await statusHandler(context('/api/admin/status', {}, {}));
    expect(response.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('reports the ATS PDF commit for ?doc=ats and rejects unknown documents', async () => {
    respond(githubJson({ workflow_runs: [] }), githubJson([]));
    await statusHandler(context('/api/admin/status?doc=ats'));
    expect(mockFetch.mock.calls.map(([url]) => String(url))).toContain(
      'https://api.github.com/repos/mig1980/My-Portfolio/commits?path=public%2FCV%2FMGavrilovCV-ATS.pdf&sha=main&per_page=1'
    );
    mockFetch.mockClear();
    expect((await statusHandler(context('/api/admin/status?doc=../x'))).status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
