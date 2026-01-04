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
  if (typeof window === 'undefined' || typeof document === 'undefined') {
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
