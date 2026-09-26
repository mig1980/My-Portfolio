/**
 * @fileoverview Unit tests for analytics utility functions.
 * @author Michael Gavrilov
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOrCreateChatSessionId, trackEvent, initAnalytics } from '../utils/analytics';

const SESSION_STORAGE_KEY = 'aboutme-chat-session';
const GA_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js';

/** jsdom never fetches injected scripts, so tests settle them by hand. */
function settleInjectedGaScript(event: 'load' | 'error'): void {
  const script = document.querySelector(`script[src^="${GA_SCRIPT_SRC}"]`);
  script?.dispatchEvent(new Event(event));
}

function loadInjectedGaScript(): void {
  settleInjectedGaScript('load');
}

function failInjectedGaScript(): void {
  settleInjectedGaScript('error');
}

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    // Reset gtag
    delete window.gtag;
    delete window.dataLayer;
    document.querySelectorAll(`script[src^="${GA_SCRIPT_SRC}"]`).forEach((s) => s.remove());
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    vi.unstubAllEnvs();
  });

  describe('getOrCreateChatSessionId', () => {
    it('creates a new session ID if none exists', () => {
      const sessionId = getOrCreateChatSessionId();
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('returns the same session ID on subsequent calls', () => {
      const firstId = getOrCreateChatSessionId();
      const secondId = getOrCreateChatSessionId();
      expect(firstId).toBe(secondId);
    });

    it('persists session ID to localStorage', () => {
      const sessionId = getOrCreateChatSessionId();
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe(sessionId);
    });

    it('updates lastSeenAt on each call', () => {
      getOrCreateChatSessionId();
      const firstStored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);

      // Wait a bit to ensure timestamp changes
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      getOrCreateChatSessionId();
      const secondStored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);

      expect(secondStored.lastSeenAt).toBeGreaterThan(firstStored.lastSeenAt);
      vi.useRealTimers();
    });

    it('creates new session after TTL expires', () => {
      vi.useFakeTimers();

      const firstId = getOrCreateChatSessionId();

      // Advance past 30 minute TTL
      vi.advanceTimersByTime(31 * 60 * 1000);

      const secondId = getOrCreateChatSessionId();
      expect(secondId).not.toBe(firstId);

      vi.useRealTimers();
    });

    it('handles corrupted localStorage data', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, 'not-json');
      const sessionId = getOrCreateChatSessionId();
      expect(sessionId).toBeTruthy();
    });

    it('handles missing id in stored data', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ lastSeenAt: Date.now() }));
      const sessionId = getOrCreateChatSessionId();
      expect(sessionId).toBeTruthy();
    });
  });

  describe('trackEvent', () => {
    it('does nothing when gtag is not available', () => {
      // Should not throw
      expect(() => trackEvent('test_event', { key: 'value' })).not.toThrow();
    });

    it('calls gtag when available in production', () => {
      vi.stubEnv('PROD', true);
      const mockGtag = vi.fn();
      window.gtag = mockGtag;

      trackEvent('test_event', { param1: 'value1' });

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { param1: 'value1' });
    });

    it('sends an empty params object when none are provided', () => {
      vi.stubEnv('PROD', true);
      const mockGtag = vi.fn();
      window.gtag = mockGtag;

      trackEvent('test_event');

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {});
    });

    it('does not send events outside production', () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;

      trackEvent('test_event');

      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('does not throw when gtag itself throws', () => {
      vi.stubEnv('PROD', true);
      window.gtag = vi.fn(() => {
        throw new Error('blocked');
      });

      expect(() => trackEvent('test_event')).not.toThrow();
    });

    it('does not throw with undefined params', () => {
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('initAnalytics', () => {
    /** Fresh module instance, because init state is cached per module. */
    async function freshInit(): Promise<() => Promise<void>> {
      vi.resetModules();
      const mod = await import('../utils/analytics');
      return mod.initAnalytics;
    }

    it('does not initialize in non-production environment', async () => {
      // In test environment, PROD is false
      await initAnalytics();

      // Should not have created gtag
      expect(window.dataLayer).toBeUndefined();
    });

    it('handles missing measurement ID gracefully', async () => {
      await expect(initAnalytics()).resolves.not.toThrow();
    });

    it('ignores a measurement ID that is not a GA4 ID', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_ANALYTICS_ID', 'UA-12345-1');

      await (
        await freshInit()
      )();

      expect(warn).toHaveBeenCalled();
      expect(window.gtag).toBeUndefined();
      warn.mockRestore();
    });

    it('queues config before gtag.js has loaded', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_ANALYTICS_ID', 'G-TEST123456');

      const pending = (await freshInit())();

      // The script request is still in flight, but the queue must already accept events.
      expect(typeof window.gtag).toBe('function');
      expect(window.dataLayer?.length).toBeGreaterThan(0);

      loadInjectedGaScript();
      await expect(pending).resolves.toBeUndefined();
    });

    it('does not send a second config when called again', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_ANALYTICS_ID', 'G-TEST123456');

      const init = await freshInit();
      const pending = init();
      const queuedAfterFirstCall = window.dataLayer?.length ?? 0;

      const second = init();

      expect(window.dataLayer?.length).toBe(queuedAfterFirstCall);
      expect(document.querySelectorAll(`script[src^="${GA_SCRIPT_SRC}"]`)).toHaveLength(1);

      loadInjectedGaScript();
      await Promise.all([pending, second]);
    });

    it('resolves even when gtag.js is blocked', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_ANALYTICS_ID', 'G-TEST123456');

      const pending = (await freshInit())();
      failInjectedGaScript();

      await expect(pending).resolves.toBeUndefined();
    });
  });
});
