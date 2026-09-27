/**
 * @fileoverview Admin API for a résumé source file on GitHub, chosen with ?doc=executive|ats.
 * @description GET → { html, sha }. PUT { html, sha, message? } → validates and commits to main,
 * which triggers the Resume PDF Action. Auth is enforced by ./_middleware.ts.
 */

/// <reference types="@cloudflare/workers-types" />

import { validateResumeHtml } from '../../../resume/validate';
import { DEFAULT_DOC_ID, getResumeDocument, type ResumeDocument } from '../../../resume/documents';
import {
  BRANCH,
  decodeBase64Utf8,
  encodeBase64Utf8,
  githubFetch,
  readGitHubConfig,
  type GitHubConfig,
  type GitHubEnv,
} from '../../../resume/github';

type PagesFunction<E = unknown> = (
  context: EventContext<E, string, Record<string, unknown>>
) => Response | Promise<Response>;

interface PutBody {
  html: string;
  sha: string;
  message?: string;
}

const MAX_BODY_BYTES = 128 * 1024;
const MAX_MESSAGE_LENGTH = 72;
const SHA_PATTERN = /^[0-9a-f]{40}$/;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

/** Single-line, lowercase-first subject so the commit follows the repo's commitlint rules. */
function commitMessage(scope: string, raw: string | undefined): string {
  const subject = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE_LENGTH);
  const text = subject || 'update via admin';
  return `docs(${scope}): ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function parsePutBody(value: unknown): PutBody | null {
  if (typeof value !== 'object' || value === null) return null;
  const { html, sha, message } = value as Record<string, unknown>;
  if (typeof html !== 'string' || typeof sha !== 'string' || !SHA_PATTERN.test(sha)) return null;
  if (message !== undefined && typeof message !== 'string') return null;
  return { html, sha, message };
}

async function handleGet(config: GitHubConfig, doc: ResumeDocument): Promise<Response> {
  const response = await githubFetch(config, `/contents/${doc.src}?ref=${BRANCH}`);
  if (!response.ok) return json(502, { error: `GitHub returned ${response.status}` });

  const data = (await response.json()) as Record<string, unknown>;
  if (
    typeof data.content !== 'string' ||
    typeof data.sha !== 'string' ||
    data.encoding !== 'base64'
  ) {
    return json(502, { error: 'Unexpected response from GitHub' });
  }
  return json(200, { html: decodeBase64Utf8(data.content), sha: data.sha });
}

async function handlePut(
  request: Request,
  config: GitHubConfig,
  doc: ResumeDocument
): Promise<Response> {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json(403, { error: 'Cross-origin request blocked' });
  }
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json(415, { error: 'Content-Type must be application/json' });
  }
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) {
    return json(413, { error: 'Request is too large' });
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return json(413, { error: 'Request is too large' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json(400, { error: 'Body is not valid JSON' });
  }
  const body = parsePutBody(parsed);
  if (!body) return json(400, { error: 'Expected { html, sha, message? }' });

  const html = body.html.replace(/\r\n?/g, '\n');
  const { ok, errors } = validateResumeHtml(html, { pageMargin: doc.pageMargin });
  if (!ok) return json(422, { error: 'The résumé has problems', errors });

  const response = await githubFetch(config, `/contents/${doc.src}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: commitMessage(doc.commitScope, body.message),
      content: encodeBase64Utf8(html),
      sha: body.sha,
      branch: BRANCH,
    }),
  });
  if (response.status === 409) {
    return json(409, {
      error: 'The résumé was changed somewhere else. Reload to get the latest version.',
    });
  }
  if (!response.ok) return json(502, { error: `GitHub returned ${response.status}` });

  const data = (await response.json()) as {
    content?: { sha?: unknown };
    commit?: { sha?: unknown; html_url?: unknown };
  };
  return json(200, {
    sha: data.content?.sha,
    commitSha: data.commit?.sha,
    commitUrl: data.commit?.html_url,
  });
}

export const onRequest: PagesFunction<GitHubEnv> = async ({ request, env }) => {
  if (request.method !== 'GET' && request.method !== 'PUT') {
    return json(405, { error: 'Method not allowed' }, { Allow: 'GET, PUT' });
  }
  // Allow-listed id → fixed path; the client never supplies a path.
  const doc = getResumeDocument(new URL(request.url).searchParams.get('doc') ?? DEFAULT_DOC_ID);
  if (!doc) return json(400, { error: 'Unknown document' });
  const config = readGitHubConfig(env);
  if (!config) {
    console.error('Admin GitHub access is not configured (GITHUB_TOKEN, GITHUB_REPO)');
    return json(500, { error: 'Admin is not configured' });
  }
  try {
    return request.method === 'GET'
      ? await handleGet(config, doc)
      : await handlePut(request, config, doc);
  } catch (error) {
    console.error('Admin résumé request failed:', error instanceof Error ? error.message : error);
    return json(502, { error: 'Could not reach GitHub' });
  }
};
