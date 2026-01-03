/**
 * @fileoverview Test setup and global mocks for Vitest.
 * @description Configures testing environment with browser API mocks.
 */

import '@testing-library/jest-dom';

/**
 * Mock window.matchMedia for responsive/media query tests.
 * Returns a mock MediaQueryList object.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

/**
 * Mock window.scrollTo to prevent errors in tests.
 */
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

/**
 * Mock Element.scrollIntoView for chat widget tests.
 */
Element.prototype.scrollIntoView = () => {};

/**
 * Mock IntersectionObserver for lazy loading and visibility tests.
 */
class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
