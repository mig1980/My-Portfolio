/**
 * @fileoverview Client for the admin API (functions/api/admin/*).
 */

import type { AdminBuildStatus, AdminPublishResult, AdminResumeFile } from '../types';
import type { ResumeDocId } from '../resume/documents';

export class AdminApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: 'same-origin', ...init });
  } catch {
    // Most often an expired Cloudflare Access session redirecting to its login page.
    throw new AdminApiError(
      0,
      'Could not reach the server. If you were signed out, reload the page.'
    );
  }
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    errors?: unknown;
  } | null;
  if (!response.ok) {
    const errors = Array.isArray(body?.errors) ? body.errors.map(String) : [];
    const message =
      typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`;
    throw new AdminApiError(response.status, message, errors);
  }
  if (body === null || typeof body !== 'object') {
    // e.g. an HTML page (sign-in screen or site fallback) instead of the API.
    throw new AdminApiError(
      response.status,
      'Unexpected response from the server. If you were signed out, reload the page.'
    );
  }
  return body as T;
}

export async function loadResume(docId: ResumeDocId): Promise<AdminResumeFile> {
  const file = await request<Partial<AdminResumeFile>>(`/api/admin/resume?doc=${docId}`);
  if (typeof file.html !== 'string' || typeof file.sha !== 'string') {
    throw new AdminApiError(200, 'Unexpected response from the server.');
  }
  return { html: file.html, sha: file.sha };
}

export function publishResume(
  docId: ResumeDocId,
  html: string,
  sha: string,
  message: string
): Promise<AdminPublishResult> {
  return request<AdminPublishResult>(`/api/admin/resume?doc=${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, sha, message }),
  });
}

export function loadBuildStatus(docId: ResumeDocId): Promise<AdminBuildStatus> {
  return request<AdminBuildStatus>(`/api/admin/status?doc=${docId}`);
}
