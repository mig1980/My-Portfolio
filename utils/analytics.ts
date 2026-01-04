/**
 * @fileoverview Lightweight Google Analytics (GA4) bootstrap.
 * @description Loads gtag.js only when VITE_ANALYTICS_ID is configured.
 */

/// <reference types="vite/client" />

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js';

const CHAT_SESSION_STORAGE_KEY = 'aboutme-chat-session';
const CHAT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes (aligned with typical analytics session)

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readJsonFromStorage<T>(key: string): T | null {
  try {
    if (!canUseDom() || !window.localStorage) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonToStorage(key: string, value: unknown): void {
  try {
    if (!canUseDom() || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

function getNowMs(): number {
  return Date.now();
}

function isProbablyGaMeasurementId(value: string): boolean {
  // GA4 measurement IDs look like: G-XXXXXXXXXX
  return /^G-[A-Z0-9]{6,}$/i.test(value.trim());
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Avoid double-injection
    const existing = document.querySelector(`script[src^="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function initGtag(measurementId: string): void {
  window.dataLayer = window.dataLayer ?? [];

  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    // Helps GA attribute properly when behind reverse proxies.
    transport_type: 'beacon',
  });
}

/**
 * Initializes Google Analytics (GA4) if configured.
 * Safe to call multiple times.
 */
export async function initAnalytics(): Promise<void> {
  if (!canUseDom()) {
    return;
  }

  // Only enable in production builds.
  if (!import.meta.env.PROD) {
    return;
  }

  const measurementId = (import.meta.env.VITE_ANALYTICS_ID ?? '').trim();
  if (!measurementId) {
    return;
  }

  if (!isProbablyGaMeasurementId(measurementId)) {
    console.warn(
      `VITE_ANALYTICS_ID does not look like a GA4 measurement ID (expected G-XXXX...). Got: ${measurementId}`
    );
    return;
  }

  try {
    initGtag(measurementId);
    await loadScript(`${GA_SCRIPT_SRC}?id=${encodeURIComponent(measurementId)}`);
  } catch (error) {
    console.warn('Failed to initialize analytics', error);
  }
}

/**
 * Emits a GA4 event if analytics is enabled.
 * This is a no-op in dev builds, when GA is not configured, or when blockers prevent gtag.
 */
export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (!canUseDom()) return;
  if (!import.meta.env.PROD) return;

  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;

  try {
    gtag('event', name, params ?? {});
  } catch {
    // Never let analytics break UX.
  }
}

interface ChatSessionStorageValue {
  id: string;
  lastSeenAt: number;
}

/**
 * Returns a privacy-safe chat session ID that is consistent per visitor for ~30 minutes.
 * Stored in localStorage so it works across reloads.
 */
export function getOrCreateChatSessionId(): string | null {
  if (!canUseDom()) return null;

  const now = getNowMs();
  const existing = readJsonFromStorage<ChatSessionStorageValue>(CHAT_SESSION_STORAGE_KEY);

  if (
    existing &&
    typeof existing.id === 'string' &&
    typeof existing.lastSeenAt === 'number' &&
    now - existing.lastSeenAt <= CHAT_SESSION_TTL_MS
  ) {
    writeJsonToStorage(CHAT_SESSION_STORAGE_KEY, { ...existing, lastSeenAt: now });
    return existing.id;
  }

  const id = generateId();
  writeJsonToStorage(CHAT_SESSION_STORAGE_KEY, { id, lastSeenAt: now });
  return id;
}
