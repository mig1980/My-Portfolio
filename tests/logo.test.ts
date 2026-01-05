/**
 * @fileoverview Unit tests for logo utility functions.
 * @author Michael Gavrilov
 */

import { describe, it, expect } from 'vitest';
import { getLogoUrl, LOGO_URLS } from '../utils/logo';

describe('getLogoUrl', () => {
  describe('URL generation', () => {
    it('generates URL with domain', () => {
      const url = getLogoUrl('microsoft.com');
      expect(url).toContain('microsoft.com');
      expect(url).toContain('img.logo.dev');
    });

    it('includes default size parameter', () => {
      const url = getLogoUrl('google.com');
      expect(url).toContain('size=64');
    });

    it('includes default format parameter', () => {
      const url = getLogoUrl('google.com');
      expect(url).toContain('format=png');
    });

    it('includes retina parameter by default', () => {
      const url = getLogoUrl('google.com');
      expect(url).toContain('retina=true');
    });
  });

  describe('custom options', () => {
    it('accepts custom size', () => {
      const url = getLogoUrl('example.com', { size: 128 });
      expect(url).toContain('size=128');
    });

    it('accepts custom format', () => {
      const url = getLogoUrl('example.com', { format: 'webp' });
      expect(url).toContain('format=webp');
    });

    it('accepts SVG format', () => {
      const url = getLogoUrl('example.com', { format: 'svg' });
      expect(url).toContain('format=svg');
    });

    it('can disable retina', () => {
      const url = getLogoUrl('example.com', { retina: false });
      expect(url).toContain('retina=false');
    });

    it('can enable greyscale', () => {
      const url = getLogoUrl('example.com', { greyscale: true });
      expect(url).toContain('greyscale=true');
    });

    it('combines multiple options', () => {
      const url = getLogoUrl('example.com', {
        size: 256,
        format: 'webp',
        retina: true,
        greyscale: true,
      });
      expect(url).toContain('size=256');
      expect(url).toContain('format=webp');
      expect(url).toContain('retina=true');
      expect(url).toContain('greyscale=true');
    });
  });

  describe('domain handling', () => {
    it('handles domains without www', () => {
      const url = getLogoUrl('github.com');
      expect(url).toContain('github.com');
    });

    it('handles domains with subdomains', () => {
      const url = getLogoUrl('cloud.google.com');
      expect(url).toContain('cloud.google.com');
    });
  });
});

describe('LOGO_URLS', () => {
  it('has microsoft logo URL', () => {
    expect(LOGO_URLS.microsoft).toContain('microsoft.com');
  });

  it('has NYU logo URL', () => {
    expect(LOGO_URLS.nyu).toContain('nyu.edu');
  });

  it('has AWS logo URL', () => {
    expect(LOGO_URLS.aws).toContain('aws.amazon.com');
  });

  it('all URLs use img.logo.dev', () => {
    Object.values(LOGO_URLS).forEach((url) => {
      expect(url).toContain('img.logo.dev');
    });
  });
});
