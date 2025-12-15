/**
 * @fileoverview Logo.dev CDN helper utilities.
 * @description Generates optimized logo URLs using the Logo.dev API.
 * @see https://docs.logo.dev/introduction
 */

/// <reference types="vite/client" />

/**
 * Logo.dev configuration options.
 */
interface LogoOptions {
  /** Image size in pixels (default: 64) */
  size?: number;
  /** Output format (default: 'png') */
  format?: 'png' | 'webp' | 'svg';
  /** Enable retina/2x resolution (default: true) */
  retina?: boolean;
  /** Greyscale mode (default: false) */
  greyscale?: boolean;
}

/**
 * Default Logo.dev options for consistent styling.
 */
const DEFAULT_OPTIONS: LogoOptions = {
  size: 64,
  format: 'png',
  retina: true,
  greyscale: false,
};

/**
 * Logo.dev API token from environment variables.
 * Falls back to empty string if not set (logos won't load).
 */
const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN || '';

/**
 * Generates a Logo.dev CDN URL for the given domain.
 *
 * @param domain - The company domain (e.g., 'microsoft.com')
 * @param options - Optional configuration for size, format, etc.
 * @returns The full Logo.dev CDN URL
 *
 * @example
 * ```ts
 * getLogoUrl('microsoft.com')
 * // => 'https://img.logo.dev/microsoft.com?token=xxx&size=64&format=png&retina=true'
 *
 * getLogoUrl('google.com', { size: 128, format: 'webp' })
 * // => 'https://img.logo.dev/google.com?token=xxx&size=128&format=webp&retina=true'
 * ```
 */
export function getLogoUrl(domain: string, options: LogoOptions = {}): string {
  const { size, format, retina, greyscale } = { ...DEFAULT_OPTIONS, ...options };

  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    size: String(size),
    format: format || 'png',
    retina: String(retina),
  });

  if (greyscale) {
    params.set('greyscale', 'true');
  }

  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

/**
 * Pre-configured logo URLs for common domains used in the portfolio.
 * Provides type-safe access to frequently used logos.
 */
export const LOGO_URLS = {
  // Companies
  microsoft: getLogoUrl('microsoft.com'),
  alliedTesting: getLogoUrl('alliedtesting.com'),

  // Education
  nyu: getLogoUrl('nyu.edu'),
  bmstu: getLogoUrl('bmstu.ru'),

  // Certifications
  wharton: getLogoUrl('wharton.upenn.edu'),
  insead: getLogoUrl('insead.edu'),
  aws: getLogoUrl('aws.amazon.com'),
} as const;
