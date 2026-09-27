/**
 * @fileoverview Admin API: status of the latest résumé PDF build and the last PDF commit on main.
 * Auth is enforced by ./_middleware.ts.
 */

/// <reference types="@cloudflare/workers-types" />

import {
  BRANCH,
  PDF_PATH,
  PDF_WORKFLOW,
  githubFetch,
  readGitHubConfig,
  type GitHubEnv,
} from '../../../resume/github';

type PagesFunction<E = unknown> = (
  context: EventContext<E, string, Record<string, unknown>>
) => Response | Promise<Response>;

interface WorkflowRun {
  status?: string;
  conclusion?: string | null;
  html_url?: string;
  updated_at?: string;
  head_sha?: string;
}

interface CommitItem {
  sha?: string;
  html_url?: string;
  commit?: { committer?: { date?: string } };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export const onRequest: PagesFunction<GitHubEnv> = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
  }
  const config = readGitHubConfig(env);
  if (!config) {
    console.error('Admin GitHub access is not configured (GITHUB_TOKEN, GITHUB_REPO)');
    return json(500, { error: 'Admin is not configured' });
  }

  try {
    const [runsResponse, commitsResponse] = await Promise.all([
      githubFetch(config, `/actions/workflows/${PDF_WORKFLOW}/runs?branch=${BRANCH}&per_page=1`),
      githubFetch(config, `/commits?path=${encodeURIComponent(PDF_PATH)}&sha=${BRANCH}&per_page=1`),
    ]);
    // 404 = the workflow file isn't on main yet; report "no runs" rather than an error.
    if ((!runsResponse.ok && runsResponse.status !== 404) || !commitsResponse.ok) {
      return json(502, { error: 'GitHub returned an error' });
    }

    const runs = runsResponse.ok
      ? ((await runsResponse.json()) as { workflow_runs?: WorkflowRun[] })
      : {};
    const commits = (await commitsResponse.json()) as CommitItem[];
    const run = runs.workflow_runs?.[0];
    const pdfCommit = Array.isArray(commits) ? commits[0] : undefined;

    return json(200, {
      run: run
        ? {
            status: run.status,
            conclusion: run.conclusion ?? null,
            url: run.html_url,
            updatedAt: run.updated_at,
            headSha: run.head_sha,
          }
        : null,
      pdf: pdfCommit
        ? {
            sha: pdfCommit.sha,
            url: pdfCommit.html_url,
            date: pdfCommit.commit?.committer?.date,
          }
        : null,
    });
  } catch (error) {
    console.error('Admin status request failed:', error instanceof Error ? error.message : error);
    return json(502, { error: 'Could not reach GitHub' });
  }
};
