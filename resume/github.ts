/**
 * @fileoverview Minimal GitHub REST client for the admin Pages Functions.
 * Uses only Workers-compatible APIs (fetch, atob/btoa, TextEncoder/TextDecoder).
 */

export const PDF_WORKFLOW = 'resume-pdf.yml';
export const BRANCH = 'main';

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export interface GitHubEnv {
  /** Fine-grained PAT: this repo only, Contents read/write, Actions read. */
  GITHUB_TOKEN?: string;
  /** "owner/name", e.g. "mig1980/My-Portfolio" */
  GITHUB_REPO?: string;
}

export interface GitHubConfig {
  token: string;
  repo: string;
}

export function readGitHubConfig(env: GitHubEnv): GitHubConfig | null {
  const token = env.GITHUB_TOKEN?.trim();
  const repo = env.GITHUB_REPO?.trim();
  if (!token || !repo || !REPO_PATTERN.test(repo)) return null;
  return { token, repo };
}

/** Calls `https://api.github.com/repos/{repo}{path}`. */
export function githubFetch(
  config: GitHubConfig,
  path: string,
  init: { method?: string; body?: string } = {}
): Promise<Response> {
  return fetch(`https://api.github.com/repos/${config.repo}${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gavrilov-ai-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export function encodeBase64Utf8(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** GitHub wraps base64 content in newlines; those are stripped first. */
export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}
