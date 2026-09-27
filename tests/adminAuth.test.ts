/**
 * @fileoverview Unit tests for the /api/admin/* Cloudflare Access middleware.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { onRequest as OnRequest } from '../functions/api/admin/_middleware';

type Middleware = typeof OnRequest;
type AdminContext = Parameters<Middleware>[0];

const TEAM = 'gavrilov.cloudflareaccess.com';
const ISSUER = `https://${TEAM}`;
const CERTS_URL = `${ISSUER}/cdn-cgi/access/certs`;
const AUD = 'test-aud-tag';
const ADMIN = 'admin@example.com';
const KID = 'key-1';
const ENV = { CF_ACCESS_TEAM_DOMAIN: TEAM, CF_ACCESS_AUD: AUD, ADMIN_EMAIL: ADMIN };

const mockFetch = vi.fn() as Mock;
let signingKey: CryptoKeyPair;
let otherKey: CryptoKeyPair;
let onRequest: Middleware;

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function segment(value: object): string {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

async function makeRsaKey(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
}

async function signToken(
  claims: Record<string, unknown> = {},
  options: { header?: Record<string, unknown>; key?: CryptoKey } = {}
): Promise<string> {
  const nowS = Math.floor(Date.now() / 1000);
  const header = segment({ alg: 'RS256', kid: KID, typ: 'JWT', ...options.header });
  const payload = segment({
    aud: [AUD],
    iss: ISSUER,
    email: ADMIN,
    iat: nowS,
    exp: nowS + 3600,
    ...claims,
  });
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    options.key ?? signingKey.privateKey,
    encoder.encode(`${header}.${payload}`)
  );
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

async function jwksResponse(kid = KID): Promise<Response> {
  const jwk = await crypto.subtle.exportKey('jwk', signingKey.publicKey);
  return new Response(JSON.stringify({ keys: [{ ...jwk, kid }] }), { status: 200 });
}

function createContext(token?: string, env: Record<string, string> = ENV) {
  const headers = new Headers(token ? { 'Cf-Access-Jwt-Assertion': token } : {});
  const next = vi.fn(async () => new Response('secret data', { status: 200 }));
  const data: Record<string, unknown> = {};
  const context = {
    request: new Request('https://gavrilov.ai/api/admin/resume', { headers }),
    env,
    data,
    next,
  } as unknown as AdminContext;
  return { context, next, data };
}

async function run(token?: string, env?: Record<string, string>) {
  const { context, next, data } = createContext(token, env);
  const response = await onRequest(context);
  return { response, next, data, body: await response.text() };
}

describe('/api/admin/* middleware', () => {
  beforeEach(async () => {
    signingKey ??= await makeRsaKey();
    otherKey ??= await makeRsaKey();
    mockFetch.mockReset();
    mockFetch.mockImplementation(() => jwksResponse());
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Fresh module each test so the JWKS cache starts empty.
    vi.resetModules();
    ({ onRequest } = await import('../functions/api/admin/_middleware'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('passes a valid token through and marks the response no-store', async () => {
    const { response, next, data, body } = await run(await signToken());
    expect(response.status).toBe(200);
    expect(body).toBe('secret data');
    expect(next).toHaveBeenCalledOnce();
    expect(data.adminEmail).toBe(ADMIN);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(mockFetch).toHaveBeenCalledWith(CERTS_URL);
  });

  it('accepts a string aud and a differently-cased admin email', async () => {
    const token = await signToken({ aud: AUD, email: 'Admin@Example.com' });
    expect((await run(token)).response.status).toBe(200);
  });

  it('returns 401 when the header is missing', async () => {
    const { response, next } = await run();
    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(next).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    ['a malformed token', 'not-a-jwt'],
    ['a token with junk segments', 'a.b.c'],
  ])('returns 401 for %s', async (_label, token) => {
    const { response, next } = await run(token);
    expect(response.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a bad signature', async () => {
    const token = await signToken({}, { key: otherKey.privateKey });
    const { response, next } = await run(token);
    expect(response.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the payload was tampered with after signing', async () => {
    const [header, , signature] = (await signToken()).split('.');
    const forged = segment({ aud: [AUD], iss: ISSUER, email: ADMIN, exp: 9999999999 });
    expect((await run(`${header}.${forged}.${signature}`)).response.status).toBe(401);
  });

  it.each([
    ['wrong aud', { aud: ['someone-else'] }],
    ['wrong issuer', { iss: 'https://evil.cloudflareaccess.com' }],
    ['expired', { exp: Math.floor(Date.now() / 1000) - 3600 }],
    ['missing exp', { exp: undefined }],
    ['not yet valid', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ])('returns 401 for %s', async (_label, claims) => {
    const { response, next } = await run(await signToken(claims));
    expect(response.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['alg none', { alg: 'none' }],
    ['alg HS256', { alg: 'HS256' }],
    ['missing kid', { kid: undefined }],
  ])('returns 401 for %s', async (_label, header) => {
    expect((await run(await signToken({}, { header }))).response.status).toBe(401);
  });

  it('returns 403 for a valid token from another user', async () => {
    const { response, next, body } = await run(await signToken({ email: 'intruder@example.com' }));
    expect(response.status).toBe(403);
    expect(body).not.toContain('secret');
    expect(next).not.toHaveBeenCalled();
  });

  it('caches the signing keys between requests', async () => {
    await run(await signToken());
    await run(await signToken());
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('refetches the keys once when the kid is unknown (key rotation)', async () => {
    mockFetch
      .mockImplementationOnce(() => jwksResponse('old-key'))
      .mockImplementationOnce(() => jwksResponse(KID));
    expect((await run(await signToken())).response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 401 when the kid is still unknown after refetching', async () => {
    mockFetch.mockImplementation(() => jwksResponse('old-key'));
    expect((await run(await signToken())).response.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('limits unknown-kid refetches to one per 30 seconds', async () => {
    mockFetch.mockImplementation(() => jwksResponse('old-key'));
    await run(await signToken());
    await run(await signToken());
    await run(await signToken());
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 503 when the signing keys cannot be fetched', async () => {
    mockFetch.mockResolvedValue(new Response('down', { status: 500 }));
    const { response, next } = await run(await signToken());
    expect(response.status).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['missing audience', { ...ENV, CF_ACCESS_AUD: '' }],
    ['missing admin email', { ...ENV, ADMIN_EMAIL: '' }],
    ['a non-Access team domain', { ...ENV, CF_ACCESS_TEAM_DOMAIN: 'evil.example.com' }],
  ])('fails closed with 500 for %s', async (_label, env) => {
    const { response, next } = await run(await signToken(), env);
    expect(response.status).toBe(500);
    expect(next).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('accepts the team domain written as a URL', async () => {
    const env = { ...ENV, CF_ACCESS_TEAM_DOMAIN: `https://${TEAM}/` };
    expect((await run(await signToken(), env)).response.status).toBe(200);
  });
});
