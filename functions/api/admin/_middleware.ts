/**
 * @fileoverview Guards every /api/admin/* request.
 * @description Cloudflare Access protects these routes at the edge; this middleware verifies the
 * Access JWT again (RS256 signature, audience, issuer, expiry, admin email) as defense in depth.
 */

/// <reference types="@cloudflare/workers-types" />

type PagesFunction<E = unknown> = (
  context: EventContext<E, string, Record<string, unknown>>
) => Response | Promise<Response>;

interface Env {
  /** e.g. "myteam.cloudflareaccess.com" */
  CF_ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag from the Access application */
  CF_ACCESS_AUD?: string;
  ADMIN_EMAIL?: string;
}

interface AccessJwk extends JsonWebKey {
  kid?: string;
}

interface JwtHeader {
  alg?: unknown;
  kid?: unknown;
}

interface JwtPayload {
  aud?: unknown;
  iss?: unknown;
  exp?: unknown;
  nbf?: unknown;
  email?: unknown;
}

type Verification =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

const JWKS_TTL_MS = 10 * 60 * 1000;
/** Unknown-kid refetches are limited so forged tokens can't hammer the certs endpoint. */
const JWKS_FORCED_REFRESH_MS = 30 * 1000;
const CLOCK_SKEW_S = 60;
const TEAM_DOMAIN_PATTERN = /^[a-z0-9-]+\.cloudflareaccess\.com$/;
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

let jwksCache: { url: string; keys: AccessJwk[]; expiresAt: number } | null = null;
let lastForcedRefreshAt = 0;

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS },
  });
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeSegment<T>(segment: string): T | null {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function normalizeTeamDomain(raw: string): string | null {
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  return TEAM_DOMAIN_PATTERN.test(domain) ? domain : null;
}

async function fetchJwks(url: string, forceRefresh: boolean): Promise<AccessJwk[] | null> {
  const now = Date.now();
  if (!forceRefresh && jwksCache?.url === url && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const body = (await response.json()) as { keys?: unknown };
    if (!Array.isArray(body.keys)) return null;
    const keys = body.keys.filter(
      (key): key is AccessJwk => typeof key === 'object' && key !== null && 'kid' in key
    );
    jwksCache = { url, keys, expiresAt: now + JWKS_TTL_MS };
    return keys;
  } catch {
    return null;
  }
}

async function findKey(url: string, kid: string): Promise<AccessJwk | null | 'unavailable'> {
  const cached = await fetchJwks(url, false);
  if (cached === null) return 'unavailable';
  const hit = cached.find((key) => key.kid === kid);
  if (hit) return hit;
  // Unknown kid usually means Access rotated its keys; refetch, at most every 30 s.
  const now = Date.now();
  if (now - lastForcedRefreshAt < JWKS_FORCED_REFRESH_MS) return null;
  lastForcedRefreshAt = now;
  const fresh = await fetchJwks(url, true);
  if (fresh === null) return 'unavailable';
  return fresh.find((key) => key.kid === kid) ?? null;
}

async function verifySignature(
  jwk: AccessJwk,
  signingInput: string,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );
  } catch {
    return false;
  }
}

async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  audience: string,
  adminEmail: string
): Promise<Verification> {
  const denied: Verification = { ok: false, status: 401, error: 'Not signed in' };
  const parts = token.split('.');
  if (parts.length !== 3) return denied;
  const [headerPart = '', payloadPart = '', signaturePart = ''] = parts;

  const header = decodeSegment<JwtHeader>(headerPart);
  if (header?.alg !== 'RS256' || typeof header.kid !== 'string') return denied;

  const issuer = `https://${teamDomain}`;
  const jwk = await findKey(`${issuer}/cdn-cgi/access/certs`, header.kid);
  if (jwk === 'unavailable') {
    return { ok: false, status: 503, error: 'Could not verify sign-in' };
  }
  if (jwk === null) return denied;

  let signature: Uint8Array;
  try {
    signature = base64UrlToBytes(signaturePart);
  } catch {
    return denied;
  }
  if (!(await verifySignature(jwk, `${headerPart}.${payloadPart}`, signature))) return denied;

  // Claims are only trusted after the signature checks out.
  const payload = decodeSegment<JwtPayload>(payloadPart);
  if (!payload) return denied;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const nowS = Date.now() / 1000;
  if (
    !audiences.includes(audience) ||
    payload.iss !== issuer ||
    typeof payload.exp !== 'number' ||
    payload.exp < nowS - CLOCK_SKEW_S ||
    (typeof payload.nbf === 'number' && payload.nbf > nowS + CLOCK_SKEW_S)
  ) {
    return denied;
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || email !== adminEmail.trim().toLowerCase()) {
    return { ok: false, status: 403, error: 'Not allowed' };
  }
  return { ok: true, email };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN ?? '');
  const audience = env.CF_ACCESS_AUD?.trim();
  const adminEmail = env.ADMIN_EMAIL?.trim();
  if (!teamDomain || !audience || !adminEmail) {
    console.error(
      'Admin auth is not configured (CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, ADMIN_EMAIL)'
    );
    return jsonError(500, 'Admin is not configured');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return jsonError(401, 'Not signed in');

  const result = await verifyAccessJwt(token, teamDomain, audience, adminEmail);
  if (!result.ok) return jsonError(result.status, result.error);

  context.data.adminEmail = result.email;
  const upstream = await context.next();
  const response = new Response(upstream.body, upstream);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
};
